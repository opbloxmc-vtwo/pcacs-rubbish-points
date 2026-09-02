const SUPABASE_URL = "https://pozzgdgkqnspksidixkv.supabase.co";
const SUPABASE_KEY = "sb_publishable_nHzAUpD33rmZTKttdzwDgg_Q7Cy6QZq";

const supabaseClient = window.supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);

const form = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const button = document.getElementById("loginButton");
const message = document.getElementById("message");

function showMessage(text, type) {
if (!message) {
return;
}

message.textContent = text;
message.className = "message " + type;

}

if (form) {

form.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const emailValue =
            email.value.trim();

        const passwordValue =
            password.value;


        if (
            !emailValue ||
            !passwordValue
        ) {

            showMessage(
                "Please enter your email and password.",
                "error"
            );

            return;
        }


        button.disabled = true;

        button.textContent =
            "Logging in...";


        try {

            const result =
                await supabaseClient.auth.signInWithPassword({
                    email: emailValue,
                    password: passwordValue
                });


            if (result.error) {

                console.error(
                    "Supabase login error:",
                    result.error
                );

                showMessage(
                    result.error.message,
                    "error"
                );

                button.disabled =
                    false;

                button.textContent =
                    "Login";

                return;
            }


            if (
                !result.data ||
                !result.data.session
            ) {

                showMessage(
                    "Login failed. No session was created.",
                    "error"
                );

                button.disabled =
                    false;

                button.textContent =
                    "Login";

                return;
            }


            console.log(
                "Login successful:",
                result.data.user.email
            );


            showMessage(
                "Login successful! Redirecting...",
                "success"
            );


            setTimeout(
                function() {

                    window.location.href =
                        "teacherpage.html";

                },
                500
            );


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            showMessage(
                "Unable to log in. Please try again.",
                "error"
            );


            button.disabled =
                false;

            button.textContent =
                "Login";
        }

    }
);

}