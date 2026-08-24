// ============================================
// TOAST SYSTEM
// ============================================

function showToast(
    title,
    message,
    type = "success",
    duration = 3500
) {

    const container =
        document.getElementById(
            "toastContainer"
        );


    const toast =
        document.createElement("div");


    toast.className =
        "toast " + type;


    toast.innerHTML = `

        <div class="toast-title">
            ${escapeHtml(title)}
        </div>

        <div class="toast-message">
            ${escapeHtml(message)}
        </div>

    `;


    container.appendChild(toast);


    setTimeout(function() {

        toast.style.animation =
            "toastOut 0.25s ease";


        setTimeout(function() {

            toast.remove();

        }, 250);

    }, duration);

}



// ============================================
// LOGIN
// ============================================

async function login() {

    const email =
        document
            .getElementById("email")
            .value
            .trim();


    const password =
        document
            .getElementById("password")
            .value;


    const errorElement =
        document.getElementById("error");


    errorElement.textContent = "";


    if (!email || !password) {

        showToast(
            "Login Failed",
            "Please enter your email and password.",
            "error"
        );

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient.auth
            .signInWithPassword({

                email: email,

                password: password

            });


    if (error) {

        showToast(
            "Login Failed",
            error.message,
            "error"
        );

        return;

    }


    showToast(
        "Welcome!",
        "You have successfully logged in.",
        "success"
    );


    showTeacherPanel(
        data.user
    );

}



// ============================================
// SHOW PANEL
// ============================================

function showTeacherPanel(user) {

    document.getElementById(
        "loginScreen"
    ).style.display = "none";


    document.getElementById(
        "teacherPanel"
    ).style.display = "block";


    document.getElementById(
        "teacherEmail"
    ).textContent =
        user.email;


    loadPoints();

    loadLogs();

}



// ============================================
// CHECK LOGIN
// ============================================

async function checkLogin() {

    const {
        data: {
            user
        }
    } =
        await supabaseClient.auth
            .getUser();


    if (user) {

        showTeacherPanel(user);

    }

}



// ============================================
// LOGOUT
// ============================================

async function logout() {

    await supabaseClient.auth.signOut();


    document.getElementById(
        "teacherPanel"
    ).style.display = "none";


    document.getElementById(
        "loginScreen"
    ).style.display = "block";


    document.getElementById(
        "password"
    ).value = "";


    showToast(
        "Logged Out",
        "You have been logged out.",
        "success"
    );

}



// ============================================
// CHANGE POINTS
// ============================================

async function changePoints(
    faction,
    amount
) {

    const {
        data: {
            user
        }
    } =
        await supabaseClient.auth
            .getUser();


    if (!user) {

        showToast(
            "Not Logged In",
            "Please log in again.",
            "error"
        );

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("factions")
            .select("points")
            .eq("name", faction)
            .single();


    if (error) {

        console.error(error);

        showToast(
            "Error",
            "Failed to get faction points.",
            "error"
        );

        return;

    }


    const pointsBefore =
        data.points;


    let newPoints =
        pointsBefore + amount;


    if (newPoints < 0) {

        newPoints = 0;

    }


    const actualChange =
        newPoints - pointsBefore;


    const {
        error: updateError
    } =
        await supabaseClient
            .from("factions")
            .update({

                points: newPoints

            })
            .eq("name", faction);


    if (updateError) {

        console.error(updateError);

        showToast(
            "Update Failed",
            updateError.message,
            "error"
        );

        return;

    }


    // ========================================
    // LOG
    // ========================================

    const {
        error: logError
    } =
        await supabaseClient
            .from("point_logs")
            .insert({

                teacher_email:
                    user.email,

                action:
                    actualChange >= 0
                        ? "ADD_POINTS"
                        : "REMOVE_POINTS",

                faction:
                    faction,

                points_change:
                    actualChange,

                points_before:
                    pointsBefore,

                points_after:
                    newPoints

            });


    if (logError) {

        console.error(
            "Logging failed:",
            logError
        );

    }


    const factionDisplay =
        faction.charAt(0).toUpperCase()
        + faction.slice(1);


    if (actualChange > 0) {

        showToast(
            "Points Added",
            `${factionDisplay} received +${actualChange} point${actualChange === 1 ? "" : "s"}.`,
            "success"
        );

    } else if (actualChange < 0) {

        showToast(
            "Points Removed",
            `${factionDisplay} lost ${Math.abs(actualChange)} point${Math.abs(actualChange) === 1 ? "" : "s"}.`,
            "warning"
        );

    } else {

        showToast(
            "No Change",
            `${factionDisplay} already has 0 points.`,
            "warning"
        );

    }


    loadPoints();

    loadLogs();

}



// ============================================
// RESET ONE FACTION
// ============================================

async function resetFaction(
    faction
) {

    const {
        data: {
            user
        }
    } =
        await supabaseClient.auth
            .getUser();


    if (!user) {

        showToast(
            "Not Logged In",
            "Please log in again.",
            "error"
        );

        return;

    }


    // Get current points

    const {
        data,
        error
    } =
        await supabaseClient
            .from("factions")
            .select("points")
            .eq("name", faction)
            .single();


    if (error) {

        console.error(error);

        showToast(
            "Error",
            "Failed to get faction points.",
            "error"
        );

        return;

    }


    const pointsBefore =
        data.points;


    // Nothing to reset

    if (pointsBefore === 0) {

        showToast(
            "Already Reset",
            `${faction} already has 0 points.`,
            "warning"
        );

        return;

    }


    // Reset

    const {
        error: updateError
    } =
        await supabaseClient
            .from("factions")
            .update({

                points: 0

            })
            .eq("name", faction);


    if (updateError) {

        console.error(updateError);

        showToast(
            "Reset Failed",
            updateError.message,
            "error"
        );

        return;

    }


    // ========================================
    // LOG RESET
    // ========================================

    const {
        error: logError
    } =
        await supabaseClient
            .from("point_logs")
            .insert({

                teacher_email:
                    user.email,

                action:
                    "RESET",

                faction:
                    faction,

                points_change:
                    -pointsBefore,

                points_before:
                    pointsBefore,

                points_after:
                    0

            });


    if (logError) {

        console.error(
            "Logging failed:",
            logError
        );

    }


    const factionDisplay =
        faction.charAt(0).toUpperCase()
        + faction.slice(1);


    showToast(
        "Faction Reset",
        `${factionDisplay} has been reset to 0 points.`,
        "success"
    );


    loadPoints();

    loadLogs();

}



// ============================================
// LOAD LOGS
// ============================================

async function loadLogs() {

    const logsBody =
        document.getElementById(
            "logsBody"
        );


    if (!logsBody) {

        return;

    }


    const factionFilter =
        document.getElementById(
            "logFaction"
        ).value;


    const actionFilter =
        document.getElementById(
            "logAction"
        ).value;


    let query =
        supabaseClient
            .from("point_logs")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(100);


    if (factionFilter !== "all") {

        query =
            query.eq(
                "faction",
                factionFilter
            );

    }


    if (actionFilter !== "all") {

        query =
            query.eq(
                "action",
                actionFilter
            );

    }


    const {
        data,
        error
    } =
        await query;


    if (error) {

        console.error(error);

        logsBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="no-logs"
                >
                    ❌ Failed to load logs.
                </td>

            </tr>

        `;

        return;

    }


    if (!data || data.length === 0) {

        logsBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="no-logs"
                >
                    No logs found.
                </td>

            </tr>

        `;

        return;

    }


    logsBody.innerHTML = "";


    data.forEach(function(log) {

        const row =
            document.createElement("tr");


        const date =
            new Date(
                log.created_at
            );


        const formattedDate =
            date.toLocaleString();


        let actionText =
            log.action;


        let actionClass = "";


        if (
            log.action ===
            "ADD_POINTS"
        ) {

            actionText =
                "➕ Added Points";

            actionClass =
                "add-log";

        }


        if (
            log.action ===
            "REMOVE_POINTS"
        ) {

            actionText =
                "➖ Removed Points";

            actionClass =
                "remove-log";

        }


        if (
            log.action ===
            "RESET"
        ) {

            actionText =
                "🔄 Reset";

            actionClass =
                "reset-log";

        }


        let change =
            log.points_change;


        if (change > 0) {

            change =
                "+" + change;

        }


        row.innerHTML = `

            <td>
                ${escapeHtml(formattedDate)}
            </td>

            <td>
                ${escapeHtml(
                    log.teacher_email
                )}
            </td>

            <td class="${actionClass}">
                ${actionText}
            </td>

            <td>
                ${escapeHtml(
                    log.faction || "-"
                )}
            </td>

            <td>
                ${change}
            </td>

            <td>
                ${log.points_before ?? "-"}
            </td>

            <td>
                ${log.points_after ?? "-"}
            </td>

        `;


        logsBody.appendChild(row);

    });

}



// ============================================
// ESCAPE HTML
// ============================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}



// ============================================
// ENTER TO LOGIN
// ============================================

document
    .getElementById("password")
    .addEventListener(
        "keydown",
        function(event) {

            if (
                event.key ===
                "Enter"
            ) {

                login();

            }

        }
    );



// ============================================
// START
// ============================================

checkLogin();
