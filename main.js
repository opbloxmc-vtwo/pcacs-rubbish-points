const SUPABASE_URL = "https://pozzgdgkqnspksidixkv.supabase.co";
const SUPABASE_KEY = "sb_publishable_nHzAUpD33rmZTKttdzwDgg_Q7Cy6QZq";

const supabaseClient = window.supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);

// ========================================================
// ELEMENTS
// ========================================================

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const message = document.getElementById("message");

// ========================================================
// SHOW MESSAGE
// ========================================================

function showMessage(text, type) {

if (!message) {
    return;
}

message.textContent = text;

message.className = "message";

if (type) {
    message.classList.add(type);
}

}

// ========================================================
// LOGIN
// ========================================================

if (loginForm) {

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        if (!email || !password) {

            showMessage(
                "Please enter your email and password.",
                "error"
            );

            return;
        }


        loginButton.disabled = true;

        loginButton.textContent =
            "Logging in...";


        showMessage(
            "",
            ""
        );


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .signInWithPassword({

                        email:
                            email,

                        password:
                            password

                    });


            if (error) {

                console.error(
                    "Supabase login error:",
                    error
                );


                showMessage(
                    error.message,
                    "error"
                );


                loginButton.disabled =
                    false;

                loginButton.textContent =
                    "Login";


                return;
            }


            if (
                !data ||
                !data.session ||
                !data.user
            ) {

                showMessage(
                    "Login failed. No session was created.",
                    "error"
                );


                loginButton.disabled =
                    false;

                loginButton.textContent =
                    "Login";


                return;
            }


            console.log(
                "Login successful:",
                data.user.email
            );


            showMessage(
                "Login successful! Redirecting...",
                "success"
            );


            /*
                Wait for Supabase to finish
                storing the authentication
                session before navigating.
            */

            await new Promise(
                function (resolve) {

                    setTimeout(
                        resolve,
                        500
                    );

                }
            );


            window.location.href =
                "teacherpage.html";

        } catch (error) {

            console.error(
                "Unexpected login error:",
                error
            );


            showMessage(
                "An unexpected error occurred while logging in.",
                "error"
            );


            loginButton.disabled =
                false;

            loginButton.textContent =
                "Login";

        }

    }
);

}

// ========================================================
// CHECK EXISTING SESSION
// ========================================================

async function checkExistingSession() {

try {

    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .getSession();


    if (error) {

        console.error(
            "Session check failed:",
            error
        );

        return;
    }




} catch (error) {

    console.error(
        "Failed to check existing session:",
        error
    );

}

}

// ========================================================
// AUTH STATE LISTENER
// ========================================================

supabaseClient.auth.onAuthStateChange(
function (
event,
session
) {

    console.log(
        "Auth event:",
        event
    );


    if (
        session &&
        session.user
    ) {

        console.log(
            "Authenticated user:",
            session.user.email
        );

    }

}

);

// ========================================================
// LOAD POINTS
// ========================================================

async function loadPoints() {
    try {
        const {
            data,
            error
        } =
            await supabaseClient
                .from("factions")
                .select(
                    "name, points"
                );

        if (error) {
            console.error(
                "Failed to load points:",
                error
            );
            return;
        }

        if (!data) {
            return;
        }

        data.forEach(
            function (faction) {
                const element =
                    document.getElementById(
                        faction.name +
                        "Points"
                    );

                if (element) {
                    element.textContent =
                        Number(
                            faction.points
                        ).toLocaleString();
                }
            }
        );

    } catch (error) {
        console.error(
            "Load points error:",
            error
        );
    }
}

// ========================================================
// AUTO REFRESH POINTS
// ========================================================

setInterval(
    loadPoints,
    5000
);

// ========================================================
// START
// ========================================================

checkExistingSession();
loadPoints();
