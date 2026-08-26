const SUPABASE_URL =
    "https://pozzgdgkqnspksidixkv.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_nHzAUpD33rmZTKttdzwDgg_Q7Cy6QZq";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

const DEFAULT_AVATAR =
    "https://placehold.co/200x200?text=User";

let currentUser = null;
let currentProfile = null;

let availableTags = [];
let selectedTagIds = [];

const FACTIONS = [
    "limbeck",
    "laurence",
    "moody",
    "murry"
];


// ========================================================
// TOASTS
// ========================================================

function showToast(message, type = "info") {

    const container =
        document.getElementById("toastContainer");

    if (!container) {
        return;
    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast toast-${type}`;

    toast.textContent =
        message;

    container.appendChild(toast);

    setTimeout(() => {

        toast.style.opacity = "0";

        setTimeout(
            () => toast.remove(),
            200
        );

    }, 4000);
}


// ========================================================
// ESCAPE HTML
// ========================================================

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


// ========================================================
// ROLE
// ========================================================

function formatRole(role) {

    switch (role) {

        case "admin":
            return "Admin";

        case "tester":
            return "Tester";

        case "teacher":
            return "Teacher";

        default:
            return "Member";
    }
}


// ========================================================
// LOGIN
// ========================================================

async function checkLogin() {

    const {
        data: {
            user
        }
    } =
        await supabaseClient
            .auth
            .getUser();

    if (!user) {

        window.location.href =
            "index.html";

        return false;
    }

    currentUser = user;

    return true;
}


// ========================================================
// LOAD PROFILE
// ========================================================

async function loadProfile() {

    const {
        data,
        error
    } =
        await supabaseClient

            .from("profiles")

            .select(`
                id,
                display_name,
                pronouns,
                avatar_url,
                bio,
                role
            `)

            .eq(
                "id",
                currentUser.id
            )

            .single();


    if (error) {

        console.error(
            "Failed to load profile:",
            error
        );

        showToast(
            "Failed to load your profile.",
            "error"
        );

        return;
    }


    currentProfile = data;


    const displayName =
        data.display_name ||
        "User";


    document.getElementById(
        "headerUserName"
    ).textContent =
        displayName;


    document.getElementById(
        "profileName"
    ).textContent =
        displayName;


    document.getElementById(
        "profilePronouns"
    ).textContent =
        data.pronouns ||
        "";


    const roleElement =
        document.getElementById(
            "profileRole"
        );


    roleElement.textContent =
        formatRole(data.role);


    roleElement.className =
        `role role-${data.role}`;


    document.getElementById(
        "profileBio"
    ).textContent =
        data.bio ||
        "";


    const picture =
        document.getElementById(
            "profilePicture"
        );


    picture.src =
        data.avatar_url ||
        DEFAULT_AVATAR;


    picture.onerror =
        function () {

            picture.onerror = null;

            picture.src =
                DEFAULT_AVATAR;

        };


    document.getElementById(
        "displayName"
    ).value =
        data.display_name ||
        "";


    document.getElementById(
        "pronouns"
    ).value =
        data.pronouns ||
        "";


    document.getElementById(
        "avatarUrl"
    ).value =
        data.avatar_url ||
        "";


    document.getElementById(
        "bio"
    ).value =
        data.bio ||
        "";


    if (
        data.role === "admin"
    ) {

        document.getElementById(
            "adminSection"
        ).classList.remove(
            "hidden"
        );

    }
}


// ========================================================
// LOAD POINTS
// ========================================================

async function loadPoints() {

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

        showToast(
            "Failed to load faction points.",
            "error"
        );

        return;
    }


    data.forEach(
        faction => {

            const factionName =
                String(
                    faction.name
                ).toLowerCase();


            const element =
                document.getElementById(
                    `${factionName}Points`
                );


            if (!element) {
                return;
            }


            element.textContent =
                Number(
                    faction.points || 0
                ).toLocaleString();

        }
    );
}


// ========================================================
// GET AMOUNT
// ========================================================

function getAmount(faction) {

    const input =
        document.getElementById(
            `${faction}Amount`
        );


    if (!input) {
        return null;
    }


    const amount =
        Number(
            input.value
        );


    if (
        !Number.isInteger(amount) ||
        amount <= 0
    ) {

        showToast(
            "Enter a valid amount greater than 0.",
            "error"
        );

        return null;
    }


    return amount;
}


// ========================================================
// GET CURRENT FACTION
// ========================================================

async function getFaction(
    factionName
) {

    const {
        data,
        error
    } =
        await supabaseClient

            .from("factions")

            .select(
                "name, points"
            )

            .eq(
                "name",
                factionName
            )

            .single();


    if (error) {

        console.error(
            error
        );

        showToast(
            `Could not find faction ${factionName}.`,
            "error"
        );

        return null;
    }


    return data;
}


// ========================================================
// LOG ACTION
// ========================================================

async function logPointAction(
    action,
    faction,
    pointsChange,
    pointsBefore,
    pointsAfter
) {

    /*
     * The audit table historically used teacher_email.
     * We intentionally store the profile display name here
     * rather than exposing the user's email.
     */

    const actorName =
        currentProfile?.display_name ||
        "Admin";


    const {
        error
    } =
        await supabaseClient

            .from("point_logs")

            .insert({

                teacher_email:
                    actorName,

                action:
                    action,

                faction:
                    faction,

                points_change:
                    pointsChange,

                points_before:
                    pointsBefore,

                points_after:
                    pointsAfter

            });


    if (error) {

        console.error(
            "Failed to create audit log:",
            error
        );

        return false;
    }


    return true;
}


// ========================================================
// ADD POINTS
// ========================================================

async function addPoints(
    faction
) {

    const amount =
        getAmount(faction);


    if (amount === null) {
        return;
    }


    const factionData =
        await getFaction(faction);


    if (!factionData) {
        return;
    }


    const before =
        Number(
            factionData.points || 0
        );


    const after =
        before + amount;


    const {
        error
    } =
        await supabaseClient

            .from("factions")

            .update({

                points:
                    after

            })

            .eq(
                "name",
                faction
            );


    if (error) {

        console.error(
            error
        );

        showToast(
            "Failed to add points.",
            "error"
        );

        return;
    }


    await logPointAction(
        "ADD_POINTS",
        faction,
        amount,
        before,
        after
    );


    showToast(
        `Added ${amount.toLocaleString()} point${amount === 1 ? "" : "s"} to ${capitalize(faction)}.`,
        "success"
    );


    await loadPoints();
}


// ========================================================
// REMOVE POINTS
// ========================================================

async function removePoints(
    faction
) {

    const amount =
        getAmount(faction);


    if (amount === null) {
        return;
    }


    const factionData =
        await getFaction(faction);


    if (!factionData) {
        return;
    }


    const before =
        Number(
            factionData.points || 0
        );


    const after =
        Math.max(
            0,
            before - amount
        );


    const actualChange =
        after - before;


    const {
        error
    } =
        await supabaseClient

            .from("factions")

            .update({

                points:
                    after

            })

            .eq(
                "name",
                faction
            );


    if (error) {

        console.error(
            error
        );

        showToast(
            "Failed to remove points.",
            "error"
        );

        return;
    }


    await logPointAction(
        "REMOVE_POINTS",
        faction,
        actualChange,
        before,
        after
    );


    showToast(
        `Removed ${Math.abs(actualChange).toLocaleString()} point${Math.abs(actualChange) === 1 ? "" : "s"} from ${capitalize(faction)}.`,
        "success"
    );


    await loadPoints();
}


// ========================================================
// RESET FACTION
// ========================================================

async function resetFaction(
    faction
) {

    const factionData =
        await getFaction(faction);


    if (!factionData) {
        return;
    }


    const before =
        Number(
            factionData.points || 0
        );


    if (before === 0) {

        showToast(
            `${capitalize(faction)} already has 0 points.`,
            "warning"
        );

        return;
    }


    const after = 0;


    const {
        error
    } =
        await supabaseClient

            .from("factions")

            .update({

                points:
                    0

            })

            .eq(
                "name",
                faction
            );


    if (error) {

        console.error(
            error
        );

        showToast(
            "Failed to reset faction.",
            "error"
        );

        return;
    }


    await logPointAction(
        "RESET_POINTS",
        faction,
        -before,
        before,
        after
    );


    showToast(
        `${capitalize(faction)} has been reset to 0 points.`,
        "success"
    );


    await loadPoints();
}


// ========================================================
// CAPITALIZE
// ========================================================

function capitalize(
    value
) {

    return value.charAt(0).toUpperCase()
        + value.slice(1);
}


// ========================================================
// LOAD TAGS
// ========================================================

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

            .order(
                "name",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Failed to load tags:",
            error
        );

        document.getElementById(
            "tagSelector"
        ).innerHTML = `
            <span class="error">
                Failed to load tags.
            </span>
        `;

        return;
    }


    availableTags =
        data || [];


    await loadCurrentTags();

    renderTagSelector();

    renderSelectedTags();

    renderProfileTags();
}


// ========================================================
// LOAD CURRENT TAGS
// ========================================================

async function loadCurrentTags() {

    const {
        data,
        error
    } =
        await supabaseClient

            .from("profile_tags")

            .select(
                "tag_id"
            )

            .eq(
                "profile_id",
                currentUser.id
            );


    if (error) {

        console.error(
            "Failed to load current tags:",
            error
        );

        selectedTagIds = [];

        return;
    }


    selectedTagIds =
        (data || [])
            .map(
                row => row.tag_id
            );
}


// ========================================================
// RENDER TAG SELECTOR
// ========================================================

function renderTagSelector() {

    const container =
        document.getElementById(
            "tagSelector"
        );


    if (
        !availableTags.length
    ) {

        container.innerHTML = `
            <span class="empty">
                No tags are currently available.
            </span>
        `;

        return;
    }


    container.innerHTML = "";


    availableTags.forEach(
        tag => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "tag-option";


            if (
                selectedTagIds.includes(
                    tag.id
                )
            ) {

                button.classList.add(
                    "selected"
                );

            }


            button.textContent =
                tag.name;


            if (
                tag.description
            ) {

                button.title =
                    tag.description;

            }


            button.addEventListener(
                "click",
                () => {

                    toggleTag(
                        tag.id
                    );

                }
            );


            container.appendChild(
                button
            );

        }
    );
}


// ========================================================
// TOGGLE TAG
// ========================================================

function toggleTag(
    tagId
) {

    if (
        selectedTagIds.includes(
            tagId
        )
    ) {

        selectedTagIds =
            selectedTagIds.filter(
                id => id !== tagId
            );

    } else {

        selectedTagIds.push(
            tagId
        );

    }


    renderTagSelector();

    renderSelectedTags();
}


// ========================================================
// RENDER SELECTED TAGS
// ========================================================

function renderSelectedTags() {

    const container =
        document.getElementById(
            "selectedTags"
        );


    container.innerHTML = "";


    selectedTagIds.forEach(
        tagId => {

            const tag =
                availableTags.find(
                    item =>
                        item.id === tagId
                );


            if (!tag) {
                return;
            }


            const element =
                document.createElement(
                    "span"
                );


            element.className =
                "selected-tag";


            element.innerHTML = `
                ${escapeHtml(tag.name)}
                <button
                    type="button"
                    aria-label="Remove tag"
                >
                    ×
                </button>
            `;


            element
                .querySelector("button")
                .addEventListener(
                    "click",
                    () => {

                        toggleTag(
                            tag.id
                        );

                    }
                );


            container.appendChild(
                element
            );

        }
    );
}


// ========================================================
// RENDER PROFILE TAGS
// ========================================================

function renderProfileTags() {

    const container =
        document.getElementById(
            "profileTags"
        );


    container.innerHTML = "";


    selectedTagIds.forEach(
        tagId => {

            const tag =
                availableTags.find(
                    item =>
                        item.id === tagId
                );


            if (!tag) {
                return;
            }


            const element =
                document.createElement(
                    "span"
                );


            element.className =
                "tag";


            element.textContent =
                tag.name;


            container.appendChild(
                element
            );

        }
    );
}


// ========================================================
// SAVE PROFILE
// ========================================================

async function saveProfile() {

    const displayName =
        document.getElementById(
            "displayName"
        ).value.trim();


    const pronouns =
        document.getElementById(
            "pronouns"
        ).value.trim();


    const avatarUrl =
        document.getElementById(
            "avatarUrl"
        ).value.trim();


    const bio =
        document.getElementById(
            "bio"
        ).value.trim();


    if (!displayName) {

        showToast(
            "Display name cannot be empty.",
            "error"
        );

        return;
    }


    const button =
        document.getElementById(
            "saveProfileButton"
        );


    button.disabled =
        true;


    button.textContent =
        "Saving...";


    // ================================================
    // UPDATE PROFILE
    // ================================================

    const {
        error
    } =
        await supabaseClient

            .from("profiles")

            .update({

                display_name:
                    displayName,

                pronouns:
                    pronouns || null,

                avatar_url:
                    avatarUrl || null,

                bio:
                    bio || null,

                updated_at:
                    new Date().toISOString()

            })

            .eq(
                "id",
                currentUser.id
            );


    if (error) {

        console.error(
            error
        );

        showToast(
            error.message,
            "error"
        );

        button.disabled =
            false;

        button.textContent =
            "Save Profile";

        return;
    }


    // ================================================
    // DELETE OLD TAGS
    // ================================================

    const {
        error: deleteError
    } =
        await supabaseClient

            .from("profile_tags")

            .delete()

            .eq(
                "profile_id",
                currentUser.id
            );


    if (deleteError) {

        console.error(
            deleteError
        );

        showToast(
            "Profile saved, but tags could not be updated.",
            "error"
        );

        button.disabled =
            false;

        button.textContent =
            "Save Profile";

        return;
    }


    // ================================================
    // INSERT TAGS
    // ================================================

    if (
        selectedTagIds.length > 0
    ) {

        const rows =
            selectedTagIds.map(
                tagId => ({

                    profile_id:
                        currentUser.id,

                    tag_id:
                        tagId

                })
            );


        const {
            error: tagError
        } =
            await supabaseClient

                .from("profile_tags")

                .insert(
                    rows
                );


        if (tagError) {

            console.error(
                tagError
            );

            showToast(
                "Profile saved, but tags could not be updated.",
                "error"
            );

            button.disabled =
                false;

            button.textContent =
                "Save Profile";

            return;
        }
    }


    showToast(
        "Profile updated successfully.",
        "success"
    );


    button.disabled =
        false;

    button.textContent =
        "Save Profile";


    await loadProfile();

    await loadCurrentTags();

    renderTagSelector();

    renderSelectedTags();

    renderProfileTags();
}


// ========================================================
// LOAD BADGES
// ========================================================

async function loadBadges() {

    const {
        data,
        error
    } =
        await supabaseClient

            .from("profile_badges")

            .select(`
                badge_id,
                badges (
                    id,
                    name,
                    description,
                    icon
                )
            `)

            .eq(
                "profile_id",
                currentUser.id
            );


    if (error) {

        console.error(
            "Failed to load badges:",
            error
        );

        document.getElementById(
            "profileBadges"
        ).innerHTML = `
            <span class="error">
                Failed to load badges.
            </span>
        `;

        return;
    }


    const container =
        document.getElementById(
            "profileBadges"
        );


    container.innerHTML = "";


    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML = `
            <span class="empty">
                No badges yet.
            </span>
        `;

        return;
    }


    data.forEach(
        item => {

            if (!item.badges) {
                return;
            }


            const badge =
                document.createElement(
                    "span"
                );


            badge.className =
                "tag";


            badge.textContent =
                `${item.badges.icon || "🏅"} ${item.badges.name}`;


            if (
                item.badges.description
            ) {

                badge.title =
                    item.badges.description;

            }


            container.appendChild(
                badge
            );

        }
    );
}


// ========================================================
// LOGOUT
// ========================================================

document.getElementById(
    "logoutButton"
).addEventListener(
    "click",
    async function () {

        await supabaseClient
            .auth
            .signOut();


        window.location.href =
            "index.html";

    }
);


// ========================================================
// SAVE PROFILE BUTTON
// ========================================================

document.getElementById(
    "saveProfileButton"
).addEventListener(
    "click",
    saveProfile
);


// ========================================================
// AUTOMATIC POINT REFRESH
// ========================================================

setInterval(
    loadPoints,
    2000
);


// ========================================================
// START
// ========================================================

(async function () {

    const loggedIn =
        await checkLogin();


    if (!loggedIn) {
        return;
    }


    await loadProfile();

    await loadPoints();

    await loadTags();

    await loadBadges();

})();