// ============================================
// TEACHER LOGIN
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

        errorElement.textContent =
            "❌ Please enter your email and password.";

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient.auth.signInWithPassword({

            email: email,

            password: password

        });


    if (error) {

        errorElement.textContent =
            "❌ " + error.message;

        return;

    }


    showTeacherPanel(data.user);

}



// ============================================
// SHOW TEACHER PANEL
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
    ).textContent = user.email;


    loadPoints();

    loadLogs();

}



// ============================================
// CHECK EXISTING LOGIN
// ============================================

async function checkLogin() {

    const {
        data: {
            user
        }
    } =
        await supabaseClient.auth.getUser();


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


    document.getElementById(
        "error"
    ).textContent = "";

}



// ============================================
// ADD / REMOVE POINTS
// ============================================

async function changePoints(
    faction,
    amount
) {

    const status =
        document.getElementById("status");


    status.textContent =
        "Updating...";


    // Get logged-in teacher

    const {
        data: {
            user
        }
    } =
        await supabaseClient.auth.getUser();


    if (!user) {

        status.textContent =
            "❌ You are not logged in.";

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

        status.textContent =
            "❌ Failed to get current points.";

        return;

    }


    const pointsBefore =
        data.points;


    let newPoints =
        pointsBefore + amount;


    // Prevent negative points

    if (newPoints < 0) {

        newPoints = 0;

    }


    const actualChange =
        newPoints - pointsBefore;


    // ========================================
    // UPDATE FACTION
    // ========================================

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

        status.textContent =
            "❌ Failed to update points.";

        return;

    }


    // ========================================
    // CREATE LOG
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
                    actualChange > 0
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
            "Failed to create log:",
            logError
        );

    }


    status.textContent =
        "✅ Points updated!";


    loadPoints();

    loadLogs();

}



// ============================================
// RESET ALL POINTS
// ============================================

async function resetAllPoints() {

    const confirmed =
        confirm(
            "⚠️ Are you sure you want to reset ALL faction points to 0?"
        );


    if (!confirmed) {

        return;

    }


    const {
        data: {
            user
        }
    } =
        await supabaseClient.auth.getUser();


    if (!user) {

        alert(
            "You are not logged in."
        );

        return;

    }


    // Get current scores

    const {
        data,
        error
    } =
        await supabaseClient
            .from("factions")
            .select("name, points");


    if (error) {

        console.error(error);

        return;

    }


    // Reset scores

    const {
        error: updateError
    } =
        await supabaseClient
            .from("factions")
            .update({

                points: 0

            })
            .not(
                "name",
                "is",
                null
            );


    if (updateError) {

        console.error(updateError);

        document.getElementById(
            "status"
        ).textContent =
            "❌ Failed to reset points.";

        return;

    }


    // ========================================
    // CREATE RESET LOGS
    // ========================================

    const logs =
        data
            .filter(
                faction =>
                    faction.points !== 0
            )
            .map(
                faction => ({

                    teacher_email:
                        user.email,

                    action:
                        "RESET",

                    faction:
                        faction.name,

                    points_change:
                        -faction.points,

                    points_before:
                        faction.points,

                    points_after:
                        0

                })
            );


    if (logs.length > 0) {

        const {
            error: logError
        } =
            await supabaseClient
                .from("point_logs")
                .insert(logs);


        if (logError) {

            console.error(
                "Failed to create reset logs:",
                logError
            );

        }

    }


    document.getElementById(
        "status"
    ).textContent =
        "✅ All points have been reset!";


    loadPoints();

    loadLogs();

}



// ============================================
// LOAD LOGS
// ============================================

async function loadLogs() {

    const logsBody =
        document.getElementById("logsBody");


    if (!logsBody) {

        return;

    }


    logsBody.innerHTML = `
        <tr>
            <td colspan="7" class="no-logs">
                Loading logs...
            </td>
        </tr>
    `;


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
    } = await query;


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


        // Format date

        const date =
            new Date(
                log.created_at
            );


        const formattedDate =
            date.toLocaleString();


        // Action display

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


        // Change display

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
                ${escapeHtml(log.teacher_email)}
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
// HTML ESCAPING
// ============================================

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

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
// ENTER KEY LOGIN
// ============================================

document
    .getElementById("password")
    .addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                login();

            }

        }
    );



// ============================================
// START
// ============================================

checkLogin();