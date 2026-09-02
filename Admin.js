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
let allTags = [];
let allLogs = [];
let filteredMembers = [];


/* =========================================================
   TAB SWITCHING
========================================================= */

function initTabs() {
    const tabButtons = document.querySelectorAll(".tab-button");

    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            const tabName = button.getAttribute("data-tab");
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Hide all tabs
    const allTabs = document.querySelectorAll(".tab-content");
    allTabs.forEach(tab => tab.classList.remove("active"));

    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add("active");
    }

    // Update button states
    const allButtons = document.querySelectorAll(".tab-button");
    allButtons.forEach(button => {
        button.classList.remove("active");
        if (button.getAttribute("data-tab") === tabName) {
            button.classList.add("active");
        }
    });
}


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
   UPDATE STATS
========================================================= */

function updateStats() {
    document.getElementById("statMembers").textContent = allUsers.length;
    document.getElementById("statBadges").textContent = allBadges.length;
    document.getElementById("statTags").textContent = allTags.length;
    document.getElementById("statActions").textContent = allLogs.length;
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

    allUsers = data || [];
    filteredMembers = allUsers;

    renderMembers();
    updateStats();
}


function renderMembers() {

    const container =
        document.getElementById(
            "members-list"
        );

    container.innerHTML = "";


    if (filteredMembers.length === 0) {

        container.innerHTML =
            '<div style="color: #888; text-align: center; padding: 20px;">No members found.</div>';

        return;
    }


    filteredMembers.forEach(user => {

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

        info.className =
            "member-info";

        info.innerHTML = `
            <div class="member-name">
                ${escapeHtml(user.display_name || "Unnamed User")}
            </div>

            <div class="member-email">
                ID: ${user.id.substring(0, 8)}...
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

        controls.className =
            "member-controls";


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
   SEARCH MEMBERS
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const searchBox = 
        document.getElementById("searchMembers");

    if (searchBox) {
        searchBox.addEventListener("input", (e) => {

            const query = e.target.value.toLowerCase();

            filteredMembers = allUsers.filter(user =>
                (user.display_name || "").toLowerCase().includes(query) ||
                user.id.toLowerCase().includes(query)
            );

            renderMembers();
        });
    }

    const filterAction = 
        document.getElementById("filterAction");

    if (filterAction) {
        filterAction.addEventListener("input", (e) => {

            const query = e.target.value.toLowerCase();

            const filtered = allLogs.filter(log =>
                (log.action || "").toLowerCase().includes(query) ||
                (log.faction || "").toLowerCase().includes(query)
            );

            renderLogs(filtered);
        });
    }

    initTabs();
});


/* =========================================================
   ROLE OVERVIEW
========================================================= */

async function loadRolesOverview() {

    const container =
        document.getElementById(
            "roles-list"
        );

    const adminCount = allUsers.filter(u => u.role === "admin").length;
    const testerCount = allUsers.filter(u => u.role === "tester").length;
    const teacherCount = allUsers.filter(u => u.role === "teacher").length;

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            <div style="background: rgba(255, 74, 74, 0.1); border: 1px solid rgba(255, 74, 74, 0.3); padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 28px; font-weight: bold; color: #ff6b6b;">${adminCount}</div>
                <div style="color: #aaa; font-size: 12px;">Administrators</div>
            </div>
            <div style="background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 28px; font-weight: bold; color: #ffc107;">${testerCount}</div>
                <div style="color: #aaa; font-size: 12px;">Testers</div>
            </div>
            <div style="background: rgba(76, 175, 112, 0.1); border: 1px solid rgba(76, 175, 112, 0.3); padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 28px; font-weight: bold; color: #66bb6a;">${teacherCount}</div>
                <div style="color: #aaa; font-size: 12px;">Teachers</div>
            </div>
        </div>
    `;
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


    allBadges = data || [];
    renderBadges();
    updateStats();
}


function renderBadges() {

    const container =
        document.getElementById(
            "badges-list"
        );

    container.innerHTML = "";


    if (allBadges.length === 0) {

        container.innerHTML =
            '<div style="color: #888; text-align: center; padding: 20px;">No badges created yet.</div>';

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
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                        <strong style="font-size: 20px;">
                            ${escapeHtml(
                                badge.icon || "🏅"
                            )}
                        </strong>
                        <div>
                            <div style="color: #7fa7ff; font-weight: bold;">
                                ${escapeHtml(
                                    badge.name
                                )}
                            </div>
                            <div style="color:#888;font-size:12px;">
                                ${escapeHtml(
                                    badge.description || ""
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        class="button danger"
                        onclick="deleteBadge('${badge.id}')">
                        🗑️ Delete
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
        "✓ Badge created successfully.",
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

    if (!confirm("Are you sure you want to delete this badge?")) {
        return;
    }

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


    allTags = data || [];
    renderTags();
    updateStats();
}


function renderTags() {

    const container =
        document.getElementById(
            "tags-list"
        );

    container.innerHTML = "";


    if (allTags.length === 0) {

        container.innerHTML =
            '<div style="color: #888; text-align: center; padding: 20px;">No tags created yet.</div>';

        return;
    }

    allTags.forEach(tag => {

        const row =
            document.createElement(
                "div"
            );

        row.className =
            "member";


        row.innerHTML = `
            <div style="margin-bottom: 10px;">
                <div style="color: #7fa7ff; font-weight: bold;">
                    ${escapeHtml(tag.name)}
                </div>
                <div style="color:#888;font-size:12px;">
                    ${escapeHtml(
                        tag.description || ""
                    )}
                </div>
            </div>

            <button
                class="button danger"
                onclick="deleteTag('${tag.id}')">
                🗑️ Delete
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
        "✓ Tag created successfully.",
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

    if (!confirm("Are you sure you want to delete this tag?")) {
        return;
    }

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
            "Select a member and badge.",
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
        "🎁 Badge awarded successfully!",
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
            .limit(200);


    if (error) {

        console.error(error);

        document.getElementById(
            "logs-list"
        ).textContent =
            "Failed to load logs.";

        return;
    }


    allLogs = data || [];
    renderLogs(allLogs);
    updateStats();
}


function renderLogs(logs) {

    const container =
        document.getElementById(
            "logs-list"
        );

    container.innerHTML = "";


    if (!logs.length) {

        container.innerHTML =
            '<div style="color: #888; text-align: center; padding: 20px;">No actions logged yet.</div>';

        return;
    }


    logs.forEach(log => {

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


        const changeSign = change >= 0 ? "+" : "";
        const changeColor = change >= 0 ? "#4caf70" : "#ff4a4a";

        element.innerHTML = `
            <div class="log-action">
                ${escapeHtml(log.action)}
            </div>

            <div class="log-details">
                <strong style="color: #7fa7ff;">
                    ${escapeHtml(log.faction)}
                </strong>
                <span style="color: ${changeColor}; font-weight: bold;">
                    ${changeSign}${change.toLocaleString()}
                </span>
                points
            </div>

            <div class="log-meta">
                Teacher: ${escapeHtml(
                    log.teacher_email || "Unknown"
                )}
                | 
                ${log.points_before.toLocaleString()} → ${log.points_after.toLocaleString()}
                | 
                ${date}
            </div>
        `;


        container.appendChild(
            element
        );
    });
}


/* =========================================================
   EXPORT LOGS
========================================================= */

document.getElementById(
    "exportLogs"
).onclick = () => {

    if (allLogs.length === 0) {
        showToast("No logs to export.", "error");
        return;
    }

    let csv = "Date,Teacher,Action,Faction,Points Change,Before,After\n";

    allLogs.forEach(log => {
        const date = new Date(log.created_at).toLocaleString();
        csv += `"${date}","${log.teacher_email || "Unknown"}","${log.action}","${log.faction}",${log.points_change},${log.points_before},${log.points_after}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showToast("✓ Logs exported to CSV.", "success");
};


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
    await loadRolesOverview();

    // Auto-refresh logs every 30 seconds
    setInterval(loadLogs, 30000);

})();
