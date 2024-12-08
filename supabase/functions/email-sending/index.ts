Deno.serve(async (req) => {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      status: 204,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { 
        status: 405, 
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return new Response("Invalid request payload", { 
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }

    const sendgridApiKey = Deno.env.get("SMTP_PASS")!;
    const receiverEmail = Deno.env.get("RECEIVER_EMAIL")!;

    // Email content
    const emailContent = {
      personalizations: [
        {
          to: [{ email: receiverEmail }],
          subject: `New Contact Form Submission from ${name}`,
        },
      ],
      from: { email: "doylcc21@wfu.edu", name: "Cameron Doyle" },
      reply_to: { email },
      content: [
        {
          type: "text/plain",
          value: `New contact form submission:\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`,
        },
      ],
    };

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailContent),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SendGrid API Error:", errorText);
      throw new Error(`Failed to send email: ${response.statusText}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully!" }),
      { 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*" 
        },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error during email sending:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*" 
        },
        status: 500
      }
    );
  }
});
