// ============================================
// TOAST SYSTEM
// ============================================

function showToast(title, message, type = "success", duration = 3500) {

    const container =
        document.getElementById("toastContainer");

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


    setTimeout(function () {

        toast.style.animation =
            "toastOut 0.25s ease";

        setTimeout(function () {

            toast.remove();

        }, 250);

    }, duration);

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
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ============================================
// PROFILE SYSTEM
// ============================================

let currentProfile = null;


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


    loadPoints();

    loadLogs();

    loadProfile();

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


    currentProfile = null;


    showToast(
        "Logged Out",
        "You have been logged out.",
        "success"
    );

}


// ============================================
// LOAD PROFILE
// ============================================

async function loadProfile() {

    const {
        data: {
            user
        }
    } =
        await supabaseClient.auth.getUser();


    if (!user) return;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();


    if (error) {

        console.error(
            "Failed to load profile:",
            error
        );

        showToast(
            "Profile Error",
            "Could not load your profile.",
            "error"
        );

        return;

    }


    if (!data) {

        currentProfile = {
            id: user.id,
            display_name: "",
            pronouns: "",
            avatar_url: "",
            bio: ""
        };


        const {
            error: insertError
        } =
            await supabaseClient
                .from("profiles")
                .insert(currentProfile);


        if (insertError) {

            console.error(
                "Failed to create profile:",
                insertError
            );

        }

    } else {

        currentProfile = data;

    }


    updateProfileDisplay(user);

}


// ============================================
// UPDATE PROFILE DISPLAY
// ============================================

function updateProfileDisplay(user) {

    const displayName =
        currentProfile.display_name ||
        user.email.split("@")[0];


    document.getElementById(
        "profileDisplayName"
    ).textContent =
        displayName;


    document.getElementById(
        "profilePronouns"
    ).textContent =
        currentProfile.pronouns ||
        "Pronouns not set";


    document.getElementById(
        "profileEmail"
    ).textContent =
        user.email;


    document.getElementById(
        "profileBio"
    ).textContent =
        currentProfile.bio || "";


    const avatar =
        document.getElementById(
            "profileAvatar"
        );


    if (currentProfile.avatar_url) {

        avatar.src =
            currentProfile.avatar_url;

    } else {

        avatar.src =
            "https://placehold.co/120x120?text=Profile";

    }


    avatar.onerror = function () {

        avatar.src =
            "https://placehold.co/120x120?text=Profile";

    };

}


// ============================================
// OPEN PROFILE EDITOR
// ============================================

function openProfileEditor() {

    if (!currentProfile) {

        showToast(
            "Profile Loading",
            "Please wait for your profile to load.",
            "warning"
        );

        return;

    }


    document.getElementById(
        "editDisplayName"
    ).value =
        currentProfile.display_name || "";


    document.getElementById(
        "editPronouns"
    ).value =
        currentProfile.pronouns || "";


    document.getElementById(
        "editAvatarUrl"
    ).value =
        currentProfile.avatar_url || "";


    document.getElementById(
        "editBio"
    ).value =
        currentProfile.bio || "";


    document.getElementById(
        "profileEditor"
    ).style.display =
        "flex";

}


// ============================================
// CLOSE PROFILE EDITOR
// ============================================

function closeProfileEditor() {

    document.getElementById(
        "profileEditor"
    ).style.display =
        "none";

}


// ============================================
// SAVE PROFILE
// ============================================

async function saveProfile() {

    const {
        data: {
            user
        }
    } =
        await supabaseClient.auth.getUser();


    if (!user) {

        showToast(
            "Error",
            "You must be logged in.",
            "error"
        );

        return;

    }


    const displayName =
        document
            .getElementById("editDisplayName")
            .value
            .trim();


    const pronouns =
        document
            .getElementById("editPronouns")
            .value
            .trim();


    const avatarUrl =
        document
            .getElementById("editAvatarUrl")
            .value
            .trim();


    const bio =
        document
            .getElementById("editBio")
            .value
            .trim();


    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .upsert({
                id: user.id,
                display_name: displayName,
                pronouns: pronouns,
                avatar_url: avatarUrl,
                bio: bio,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();


    if (error) {

        console.error(error);

        showToast(
            "Profile Error",
            error.message,
            "error"
        );

        return;

    }


    currentProfile = data;


    updateProfileDisplay(user);


    closeProfileEditor();


    showToast(
        "Profile Saved",
        "Your profile has been updated!",
        "success"
    );

}


// ============================================
// CHANGE POINTS
// ============================================

async function changePoints(faction, amount) {

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


    if (actualChange !== 0) {

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
                "Logging failed:",
                logError
            );

        }

    }


    const factionDisplay =
        faction.charAt(0).toUpperCase() +
        faction.slice(1);


    if (actualChange > 0) {

        showToast(
            "Points Added",
            `${factionDisplay} received +${actualChange} point.`,
            "success"
        );

    } else if (actualChange < 0) {

        showToast(
            "Points Removed",
            `${factionDisplay} lost ${Math.abs(actualChange)} point.`,
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
// RESET FACTION
// ============================================

async function resetFaction(faction) {

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

        showToast(
            "Error",
            "Failed to get faction points.",
            "error"
        );

        return;

    }


    const pointsBefore =
        data.points;


    if (pointsBefore === 0) {

        showToast(
            "Already Reset",
            `${faction} already has 0 points.`,
            "warning"
        );

        return;

    }


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

        showToast(
            "Reset Failed",
            updateError.message,
            "error"
        );

        return;

    }


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
        faction.charAt(0).toUpperCase() +
        faction.slice(1);


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
        document.getElementById("logsBody");


    if (!logsBody) return;


    const factionFilter =
        document.getElementById("logFaction").value;


    const actionFilter =
        document.getElementById("logAction").value;


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
                <td colspan="7" class="no-logs">
                    ❌ Failed to load logs.
                </td>
            </tr>
        `;

        return;

    }


    if (!data || data.length === 0) {

        logsBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-logs">
                    No logs found.
                </td>
            </tr>
        `;

        return;

    }


    logsBody.innerHTML = "";


    data.forEach(function (log) {

        const row =
            document.createElement("tr");


        const date =
            new Date(log.created_at);


        const formattedDate =
            date.toLocaleString();


        let actionText =
            log.action;


        let actionClass = "";


        if (log.action === "ADD_POINTS") {

            actionText =
                "➕ Added Points";

            actionClass =
                "add-log";

        }


        if (log.action === "REMOVE_POINTS") {

            actionText =
                "➖ Removed Points";

            actionClass =
                "remove-log";

        }


        if (log.action === "RESET") {

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
                ${escapeHtml(log.teacher_email)}
            </td>

            <td class="${actionClass}">
                ${actionText}
            </td>

            <td>
                ${escapeHtml(log.faction || "-")}
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
// ENTER KEY LOGIN
// ============================================

document
    .getElementById("password")
    .addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                login();

            }

        }
    );


// ============================================
// START
// ============================================

checkLogin();
