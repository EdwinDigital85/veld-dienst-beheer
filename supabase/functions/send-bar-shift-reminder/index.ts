
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  days: number; // 7 of 3
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { days }: ReminderRequest = await req.json();
    
    console.log(`Checking for reminders ${days} days ahead...`);

    // Haal registraties op die een notificatie nodig hebben
    const { data: registrations, error } = await supabase
      .rpc("get_registrations_needing_notification", { notification_days: days });

    if (error) {
      console.error("Error fetching registrations:", error);
      throw error;
    }

    console.log(`Found ${registrations?.length || 0} registrations needing notifications`);

    if (!registrations || registrations.length === 0) {
      return new Response(
        JSON.stringify({ message: "No notifications to send", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verstuur emails
    const emailPromises = registrations.map(async (registration) => {
      const subject = days === 7 
        ? `Herinnering: Bardienst volgende week - ${registration.shift_title}`
        : `Herinnering: Bardienst overmorgen - ${registration.shift_title}`;

      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0c6be0;">Bardienst Herinnering</h2>
          <p>Beste ${registration.name},</p>
          <p>Dit is een herinnering dat je bent ingeschreven voor de volgende bardienst:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${registration.shift_title}</h3>
            <p style="margin: 5px 0;"><strong>Datum:</strong> ${new Date(registration.shift_date).toLocaleDateString('nl-NL', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p style="margin: 5px 0;"><strong>Tijd:</strong> ${registration.start_time} - ${registration.end_time}</p>
          </div>

          <p>We zien je graag op de afgesproken tijd!</p>
          
          <p style="margin-top: 30px;">
            Met vriendelijke groet,<br>
            <strong>v.v. Boskant</strong>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            Als je je wilt uitschrijven, kun je dat doen via de website.
          </p>
        </div>
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: "v.v. Boskant <noreply@yourdomain.com>",
          to: [registration.email],
          subject: subject,
          html: emailContent,
        });

        console.log(`Email sent to ${registration.email}:`, emailResponse);

        // Registreer dat de notificatie is verstuurd
        await supabase
          .from("email_notifications")
          .insert({
            registration_id: registration.registration_id,
            notification_type: days === 7 ? "one_week" : "three_days",
          });

        return { success: true, email: registration.email };
      } catch (error) {
        console.error(`Failed to send email to ${registration.email}:`, error);
        return { success: false, email: registration.email, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Email sending completed: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        message: `Sent ${successful} notifications successfully`,
        successful,
        failed,
        details: results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
