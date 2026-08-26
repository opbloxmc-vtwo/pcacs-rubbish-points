const SUPABASE_URL =
    "https://pozzgdgkqnspksidixkv.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_nHzAUpD33rmZTKttdzwDgg_Q7Cy6QZq";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

let currentUser = null;
let currentProfile = null;
let allUsers = [];
let allBadges = [];


/* =========================================================
   TOASTS
========================================================= */

function showToast(message, type = "info") {

    const container =
        document.getElementById(
            "toastContainer"
        );

    const toast =
        document.createElement("div");

    toast.className =
        `toast toast-${type}`;

    toast.textContent =
        message;

    container.appendChild(
        toast
    );

    setTimeout(
        () => toast.remove(),
        4000
    );
}


/* =========================================================
   AUTH + ADMIN CHECK
========================================================= */

async function checkAdmin() {

    const {
        data: {
            user
        }
    } =
        await supabaseClient.auth.getUser();

    if (!user) {

        window.location.href =
            "index.html";

        return false;
    }

    currentUser = user;


    const {
        data: profile,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select("id, display_name, role")
            .eq("id", user.id)
            .single();


    if (error ||
        !profile ||
        profile.role !== "admin") {

        showToast(
            "You do not have administrator access.",
            "error"
        );

        setTimeout(() => {

            window.location.href =
                "teacherpage.html";

        }, 1500);

        return false;
    }

    currentProfile =
        profile;

    return true;
}


/* =========================================================
   MEMBERS
========================================================= */

async function loadMembers() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select(`
                id,
                display_name,
                avatar_url,
                role
            `)
            .order(
                "display_name"
            );


    if (error) {

        console.error(error);

        showToast(
            "Failed to load members.",
            "error"
        );

        return;
    }

    allUsers =
        data || [];

    const container =
        document.getElementById(
            "members"
        );

    container.innerHTML = "";


    if (allUsers.length === 0) {

        container.textContent =
            "No members found.";

        return;
    }


    allUsers.forEach(user => {

        const member =
            document.createElement(
                "div"
            );

        member.className =
            "member";


        const top =
            document.createElement(
                "div"
            );

        top.className =
            "member-top";


        const avatar =
            document.createElement(
                "img"
            );

        avatar.className =
            "member-avatar";

        avatar.src =
            user.avatar_url ||
            "https://placehold.co/100x100?text=User";


        const info =
            document.createElement(
                "div"
            );

        info.innerHTML = `
            <div class="member-name">
                ${escapeHtml(user.display_name || "Unnamed User")}
            </div>

            <div class="member-email">
                ${user.id}
            </div>
        `;


        top.appendChild(
            avatar
        );

        top.appendChild(
            info
        );

        member.appendChild(
            top
        );


        const controls =
            document.createElement(
                "div"
            );

        controls.style.marginTop =
            "12px";


        const select =
            document.createElement(
                "select"
            );


        ["admin", "tester", "teacher"]
            .forEach(role => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    role;

                option.textContent =
                    formatRole(role);

                if (
                    user.role === role
                ) {

                    option.selected =
                        true;
                }

                select.appendChild(
                    option
                );
            });


        const save =
            document.createElement(
                "button"
            );

        save.className =
            "button primary";

        save.textContent =
            "Save Role";

        save.style.marginTop =
            "8px";


        save.onclick = async () => {

            await changeRole(
                user.id,
                select.value
            );
        };


        controls.appendChild(
            select
        );

        controls.appendChild(
            save
        );

        member.appendChild(
            controls
        );

        container.appendChild(
            member
        );
    });


    populateBadgeUsers();
}


/* =========================================================
   ROLE
========================================================= */

function formatRole(role) {

    if (role === "admin") {
        return "Admin";
    }

    if (role === "tester") {
        return "Tester";
    }

    return "Teacher";
}


/* =========================================================
   CHANGE ROLE
========================================================= */

async function changeRole(
    userId,
    role
) {

    const {
        error
    } =
        await supabaseClient
            .from("profiles")
            .update({
                role: role
            })
            .eq(
                "id",
                userId
            );


    if (error) {

        console.error(error);

        showToast(
            "Failed to change role.",
            "error"
        );

        return;
    }


    showToast(
        `Role changed to ${formatRole(role)}.`,
        "success"
    );


    await loadMembers();
}


/* =========================================================
   BADGES
========================================================= */

async function loadBadges() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("badges")
            .select(`
                id,
                name,
                description,
                icon
            `)
            .order("name");


    if (error) {

        console.error(error);

        showToast(
            "Failed to load badges.",
            "error"
        );

        return;
    }


    allBadges =
        data || [];


    const container =
        document.getElementById(
            "badges"
        );

    container.innerHTML = "";


    if (allBadges.length === 0) {

        container.textContent =
            "No badges created.";

    } else {

        allBadges.forEach(
            badge => {

                const row =
                    document.createElement(
                        "div"
                    );

                row.className =
                    "member";


                row.innerHTML = `
                    <strong>
                        ${escapeHtml(
                            badge.icon || "🏅"
                        )}
                        ${escapeHtml(
                            badge.name
                        )}
                    </strong>

                    <div style="color:#777;margin-top:5px;">
                        ${escapeHtml(
                            badge.description || ""
                        )}
                    </div>

                    <br>

                    <button
                        class="button danger"
                        onclick="deleteBadge('${badge.id}')">
                        Delete
                    </button>
                `;


                container.appendChild(
                    row
                );
            }
        );
    }


    populateBadgeSelect();
}


/* =========================================================
   CREATE BADGE
========================================================= */

document.getElementById(
    "createBadgeButton"
).onclick = async () => {

    const name =
        document.getElementById(
            "badgeName"
        ).value.trim();

    const icon =
        document.getElementById(
            "badgeIcon"
        ).value.trim();

    const description =
        document.getElementById(
            "badgeDescription"
        ).value.trim();


    if (!name) {

        showToast(
            "Enter a badge name.",
            "error"
        );

        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("badges")
            .insert({

                name: name,

                icon:
                    icon || "🏅",

                description:
                    description || null

            });


    if (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );

        return;
    }


    document.getElementById(
        "badgeName"
    ).value = "";

    document.getElementById(
        "badgeIcon"
    ).value = "";

    document.getElementById(
        "badgeDescription"
    ).value = "";


    showToast(
        "Badge created.",
        "success"
    );


    await loadBadges();
};


/* =========================================================
   DELETE BADGE
========================================================= */

async function deleteBadge(
    badgeId
) {

    const {
        error
    } =
        await supabaseClient
            .from("badges")
            .delete()
            .eq(
                "id",
                badgeId
            );


    if (error) {

        console.error(error);

        showToast(
            "Failed to delete badge.",
            "error"
        );

        return;
    }


    showToast(
        "Badge deleted.",
        "success"
    );


    await loadBadges();
}


/* =========================================================
   TAGS
========================================================= */

async function loadTags() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("tags")
            .select(`
                id,
                name,
                description
            `)
            .order("name");


    if (error) {

        console.error(error);

        showToast(
            "Failed to load tags.",
            "error"
        );

        return;
    }


    const container =
        document.getElementById(
            "tags"
        );

    container.innerHTML = "";


    data.forEach(tag => {

        const row =
            document.createElement(
                "div"
            );

        row.className =
            "member";


        row.innerHTML = `
            <strong>
                ${escapeHtml(tag.name)}
            </strong>

            <div style="color:#777;margin-top:5px;">
                ${escapeHtml(
                    tag.description || ""
                )}
            </div>

            <br>

            <button
                class="button danger"
                onclick="deleteTag('${tag.id}')">
                Delete
            </button>
        `;


        container.appendChild(
            row
        );
    });
}


/* =========================================================
   CREATE TAG
========================================================= */

document.getElementById(
    "createTagButton"
).onclick = async () => {

    const name =
        document.getElementById(
            "tagName"
        ).value.trim();

    const description =
        document.getElementById(
            "tagDescription"
        ).value.trim();


    if (!name) {

        showToast(
            "Enter a tag name.",
            "error"
        );

        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("tags")
            .insert({

                name: name,

                description:
                    description || null

            });


    if (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );

        return;
    }


    document.getElementById(
        "tagName"
    ).value = "";

    document.getElementById(
        "tagDescription"
    ).value = "";


    showToast(
        "Tag created.",
        "success"
    );


    await loadTags();
};


/* =========================================================
   DELETE TAG
========================================================= */

async function deleteTag(
    tagId
) {

    const {
        error
    } =
        await supabaseClient
            .from("tags")
            .delete()
            .eq(
                "id",
                tagId
            );


    if (error) {

        console.error(error);

        showToast(
            "Failed to delete tag.",
            "error"
        );

        return;
    }


    showToast(
        "Tag deleted.",
        "success"
    );


    await loadTags();
}


/* =========================================================
   BADGE USERS
========================================================= */

function populateBadgeUsers() {

    const select =
        document.getElementById(
            "badgeUser"
        );

    select.innerHTML = "";

    allUsers.forEach(user => {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            user.id;

        option.textContent =
            user.display_name ||
            user.id;

        select.appendChild(
            option
        );
    });
}


/* =========================================================
   BADGE SELECT
========================================================= */

function populateBadgeSelect() {

    const select =
        document.getElementById(
            "badgeSelect"
        );

    select.innerHTML = "";

    allBadges.forEach(badge => {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            badge.id;

        option.textContent =
            `${badge.icon || "🏅"} ${badge.name}`;

        select.appendChild(
            option
        );
    });
}


/* =========================================================
   GIVE BADGE
========================================================= */

document.getElementById(
    "giveBadgeButton"
).onclick = async () => {

    const profileId =
        document.getElementById(
            "badgeUser"
        ).value;

    const badgeId =
        document.getElementById(
            "badgeSelect"
        ).value;


    if (!profileId ||
        !badgeId) {

        showToast(
            "Select a user and badge.",
            "error"
        );

        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("profile_badges")
            .insert({

                profile_id:
                    profileId,

                badge_id:
                    badgeId

            });


    if (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );

        return;
    }


    showToast(
        "Badge awarded successfully.",
        "success"
    );
};


/* =========================================================
   AUDIT LOGS
========================================================= */

async function loadLogs() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("point_logs")
            .select(`
                teacher_email,
                action,
                faction,
                points_change,
                points_before,
                points_after,
                created_at
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(100);


    if (error) {

        console.error(error);

        document.getElementById(
            "logs"
        ).textContent =
            "Failed to load logs.";

        return;
    }


    const container =
        document.getElementById(
            "logs"
        );

    container.innerHTML = "";


    if (!data.length) {

        container.textContent =
            "No actions logged.";

        return;
    }


    data.forEach(log => {

        const element =
            document.createElement(
                "div"
            );

        element.className =
            "log";


        const date =
            new Date(
                log.created_at
            ).toLocaleString();


        const change =
            Number(
                log.points_change || 0
            );


        element.innerHTML = `
            <div class="log-action">
                ${escapeHtml(log.action)}
            </div>

            <div>
                <strong>
                    ${escapeHtml(log.faction)}
                </strong>

                ${change >= 0 ? "+" : ""}
                ${change.toLocaleString()}
                points
            </div>

            <div class="log-meta">
                By:
                ${escapeHtml(
                    log.teacher_email || "Unknown"
                )}

                <br>

                ${log.points_before.toLocaleString()}
                →
                ${log.points_after.toLocaleString()}

                <br>

                ${date}
            </div>
        `;


        container.appendChild(
            element
        );
    });
}


/* =========================================================
   ESCAPE
========================================================= */

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


/* =========================================================
   LOGOUT
========================================================= */

document.getElementById(
    "logoutButton"
).onclick = async () => {

    await supabaseClient
        .auth
        .signOut();

    window.location.href =
        "index.html";
};


/* =========================================================
   REFRESH LOGS
========================================================= */

document.getElementById(
    "refreshLogs"
).onclick =
    loadLogs;


/* =========================================================
   START
========================================================= */

(async function () {

    const allowed =
        await checkAdmin();

    if (!allowed) {
        return;
    }

    await loadMembers();

    await loadBadges();

    await loadTags();

    await loadLogs();

})();