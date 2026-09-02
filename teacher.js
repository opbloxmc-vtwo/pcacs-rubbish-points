// ========================================================
// SUPABASE CONFIGURATION
// ========================================================

const SUPABASE_URL =
    "https://pozzgdgkqnspksidixkv.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_nHzAUpD33rmZTKttdzwDgg_Q7Cy6QZq";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ========================================================
// CONSTANTS
// ========================================================

const DEFAULT_AVATAR =
    "https://placehold.co/200x200?text=User";


// ========================================================
// GLOBAL VARIABLES
// ========================================================

let currentUser = null;
let currentProfile = null;

let availableTags = [];
let selectedTagIds = [];


// ========================================================
// TOASTS
// ========================================================

function showToast(
    message,
    type = "info"
) {
    const container =
        document.getElementById(
            "toastContainer"
        );

    if (!container) {
        return;
    }

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        "toast toast-" + type;

    toast.textContent =
        message;

    container.appendChild(
        toast
    );

    setTimeout(
        function () {
            toast.remove();
        },
        4000
    );
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


// ========================================================
// FORMAT ROLE
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
// REDIRECT TO LOGIN
// ========================================================

function redirectToLogin() {
    if (
        window.location.pathname.endsWith(
            "login.html"
        )
    ) {
        return;
    }

    window.location.replace(
        "login.html"
    );
}


// ========================================================
// AUTHENTICATION
// ========================================================

async function checkLogin() {
    try {
        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();

        if (error) {
            console.error(
                "Failed to get session:",
                error
            );

            redirectToLogin();

            return false;
        }

        const session =
            data?.session;

        if (
            !session ||
            !session.user
        ) {
            console.log(
                "No active Supabase session."
            );

            redirectToLogin();

            return false;
        }

        currentUser =
            session.user;

        console.log(
            "Logged in as:",
            currentUser.email
        );

        console.log(
            "User ID:",
            currentUser.id
        );

        return true;

    } catch (error) {
        console.error(
            "Authentication check failed:",
            error
        );

        redirectToLogin();

        return false;
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
            "Supabase auth event:",
            event
        );

        if (
            event ===
            "SIGNED_OUT"
        ) {
            currentUser = null;
            currentProfile = null;

            redirectToLogin();

            return;
        }

        if (
            session &&
            session.user
        ) {
            currentUser =
                session.user;
        }
    }
);


// ========================================================
// LOAD PROFILE
// ========================================================

async function loadProfile() {
    if (!currentUser) {
        console.error(
            "Cannot load profile: no current user."
        );

        return;
    }

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
            .maybeSingle();

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

    if (!data) {
        console.error(
            "No profile found for user:",
            currentUser.id
        );

        showToast(
            "No profile was found for your account.",
            "error"
        );

        return;
    }

    currentProfile =
        data;


    // ====================================================
    // HEADER NAME
    // ====================================================

    const headerUserName =
        document.getElementById(
            "headerUserName"
        );

    if (headerUserName) {
        headerUserName.textContent =
            data.display_name ||
            currentUser.email ||
            "User";
    }


    // ====================================================
    // PROFILE NAME
    // ====================================================

    const profileName =
        document.getElementById(
            "profileName"
        );

    if (profileName) {
        profileName.textContent =
            data.display_name ||
            "Unnamed User";
    }


    // ====================================================
    // PRONOUNS
    // ====================================================

    const profilePronouns =
        document.getElementById(
            "profilePronouns"
        );

    if (profilePronouns) {
        profilePronouns.textContent =
            data.pronouns ||
            "";
    }


    // ====================================================
    // ROLE
    // ====================================================

    const roleElement =
        document.getElementById(
            "profileRole"
        );

    if (roleElement) {
        roleElement.textContent =
            formatRole(
                data.role
            );

        roleElement.className =
            "role role-" + data.role;
    }


    // ====================================================
    // BIO
    // ====================================================

    const profileBio =
        document.getElementById(
            "profileBio"
        );

    if (profileBio) {
        profileBio.textContent =
            data.bio ||
            "";
    }


    // ====================================================
    // PROFILE PICTURE
    // ====================================================

    const picture =
        document.getElementById(
            "profilePicture"
        );

    if (picture) {
        picture.src =
            data.avatar_url ||
            DEFAULT_AVATAR;

        picture.onerror =
            function () {
                picture.onerror =
                    null;

                picture.src =
                    DEFAULT_AVATAR;
            };
    }


    // ====================================================
    // EDIT PROFILE
    // ====================================================

    const displayName =
        document.getElementById(
            "displayName"
        );

    if (displayName) {
        displayName.value =
            data.display_name ||
            "";
    }


    const pronouns =
        document.getElementById(
            "pronouns"
        );

    if (pronouns) {
        pronouns.value =
            data.pronouns ||
            "";
    }


    const avatarUrl =
        document.getElementById(
            "avatarUrl"
        );

    if (avatarUrl) {
        avatarUrl.value =
            data.avatar_url ||
            "";
    }


    const bio =
        document.getElementById(
            "bio"
        );

    if (bio) {
        bio.value =
            data.bio ||
            "";
    }


    // ====================================================
    // ADMIN SECTION
    // ====================================================

    const adminSection =
        document.getElementById(
            "adminSection"
        );

    if (adminSection) {
        if (
            data.role ===
            "admin"
        ) {
            adminSection.classList.remove(
                "hidden"
            );
        } else {
            adminSection.classList.add(
                "hidden"
            );
        }
    }
}


// ========================================================
// LOAD TAGS
// ========================================================

async function loadTags() {
    const tagSelector =
        document.getElementById(
            "tagSelector"
        );

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

        if (tagSelector) {
            tagSelector.innerHTML =
                '<span class="error">Failed to load tags.</span>';
        }

        return;
    }

    availableTags =
        data || [];

    await loadCurrentTags();

    renderTagSelector();

    renderSelectedTags();
}


// ========================================================
// LOAD CURRENT TAGS
// ========================================================

async function loadCurrentTags() {
    if (!currentUser) {
        selectedTagIds =
            [];

        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("profile_tags")
            .select(`
                tag_id
            `)
            .eq(
                "profile_id",
                currentUser.id
            );

    if (error) {
        console.error(
            "Failed to load current tags:",
            error
        );

        selectedTagIds =
            [];

        return;
    }

    selectedTagIds =
        (data || [])
            .map(
                function (row) {
                    return row.tag_id;
                }
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

    if (!container) {
        return;
    }

    if (
        !availableTags ||
        availableTags.length === 0
    ) {
        container.innerHTML = `
            <span class="empty">
                No tags are currently available.
            </span>
        `;

        return;
    }

    container.innerHTML =
        "";

    availableTags.forEach(
        function (tag) {
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
                function () {
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
                function (id) {
                    return id !== tagId;
                }
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

    if (!container) {
        return;
    }

    container.innerHTML =
        "";

    selectedTagIds.forEach(
        function (tagId) {
            const tag =
                availableTags.find(
                    function (item) {
                        return item.id === tagId;
                    }
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

            const removeButton =
                element.querySelector(
                    "button"
                );

            if (removeButton) {
                removeButton.addEventListener(
                    "click",
                    function () {
                        toggleTag(
                            tag.id
                        );
                    }
                );
            }

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
    if (!currentUser) {
        showToast(
            "You are not logged in.",
            "error"
        );

        return;
    }

    const displayNameElement =
        document.getElementById(
            "displayName"
        );

    const pronounsElement =
        document.getElementById(
            "pronouns"
        );

    const avatarUrlElement =
        document.getElementById(
            "avatarUrl"
        );

    const bioElement =
        document.getElementById(
            "bio"
        );

    if (
        !displayNameElement ||
        !pronounsElement ||
        !avatarUrlElement ||
        !bioElement
    ) {
        showToast(
            "Profile form is missing.",
            "error"
        );

        return;
    }

    const displayName =
        displayNameElement.value.trim();

    const pronouns =
        pronounsElement.value.trim();

    const avatarUrl =
        avatarUrlElement.value.trim();

    const bio =
        bioElement.value.trim();

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

    if (button) {
        button.disabled =
            true;

        button.textContent =
            "Saving...";
    }

    const {
        error
    } =
        await supabaseClient
            .from("profiles")
            .update({
                display_name:
                    displayName,

                pronouns:
                    pronouns ||
                    null,

                avatar_url:
                    avatarUrl ||
                    null,

                bio:
                    bio ||
                    null,

                updated_at:
                    new Date()
                        .toISOString()
            })
            .eq(
                "id",
                currentUser.id
            );

    if (error) {
        console.error(
            "Failed to update profile:",
            error
        );

        showToast(
            error.message,
            "error"
        );

        if (button) {
            button.disabled =
                false;

            button.textContent =
                "Save Profile";
        }

        return;
    }

    const {
        error:
            deleteError
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
            "Failed to delete old tags:",
            deleteError
        );

        showToast(
            "Profile saved, but tags could not be updated.",
            "error"
        );

        if (button) {
            button.disabled =
                false;

            button.textContent =
                "Save Profile";
        }

        return;
    }

    if (
        selectedTagIds.length >
        0
    ) {
        const rows =
            selectedTagIds.map(
                function (tagId) {
                    return {
                        profile_id:
                            currentUser.id,

                        tag_id:
                            tagId
                    };
                }
            );

        const {
            error:
                tagError
        } =
            await supabaseClient
                .from("profile_tags")
                .insert(
                    rows
                );

        if (tagError) {
            console.error(
                "Failed to insert tags:",
                tagError
            );

            showToast(
                "Profile saved, but tags could not be updated.",
                "error"
            );

            if (button) {
                button.disabled =
                    false;

                button.textContent =
                    "Save Profile";
            }

            return;
        }
    }

    showToast(
        "Profile updated successfully.",
        "success"
    );

    if (button) {
        button.disabled =
            false;

        button.textContent =
            "Save Profile";
    }

    await loadProfile();
    await loadCurrentTags();

    renderTagSelector();
    renderSelectedTags();
}


// ========================================================
// LOAD BADGES
// ========================================================

async function loadBadges() {
    const container =
        document.getElementById(
            "profileBadges"
        );

    if (!container) {
        return;
    }

    if (!currentUser) {
        container.innerHTML = `
            <span class="error">
                You are not logged in.
            </span>
        `;

        return;
    }

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

        container.innerHTML = `
            <span class="error">
                Failed to load badges.
            </span>
        `;

        return;
    }

    container.innerHTML =
        "";

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
        function (item) {
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
// GET POINT INPUT
// ========================================================

function getFactionAmount(
    faction,
    suppliedAmount
) {
    if (
        suppliedAmount !== undefined &&
        suppliedAmount !== null &&
        suppliedAmount !== ""
    ) {
        return Number(
            suppliedAmount
        );
    }

    const input =
        document.getElementById(
            faction + "Amount"
        );

    if (!input) {
        console.error(
            "Could not find points input:",
            faction + "Amount"
        );

        return NaN;
    }

    return Number(
        input.value
    );
}


// ========================================================
// ADD POINTS
// ========================================================

async function addPoints(
    faction,
    suppliedAmount
) {
    if (!currentUser) {
        showToast(
            "You must be logged in to modify points.",
            "error"
        );

        return;
    }

    const amount =
        getFactionAmount(
            faction,
            suppliedAmount
        );

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        showToast(
            "Invalid points amount.",
            "error"
        );

        return;
    }

    try {
        const {
            data: factionData,
            error: factionError
        } =
            await supabaseClient
                .from("factions")
                .select(
                    "name, points"
                )
                .eq(
                    "name",
                    faction
                )
                .single();

        if (factionError) {
            console.error(
                "Failed to find faction:",
                factionError
            );

            showToast(
                "Could not find faction.",
                "error"
            );

            return;
        }

        const before =
            Number(
                factionData.points
            ) || 0;

        const after =
            before + amount;

        const {
            error: updateError
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

        if (updateError) {
            console.error(
                "Failed to update faction:",
                updateError
            );

            showToast(
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
                        currentUser.email ||
                        "Admin",

                    action:
                        "ADD_POINTS",

                    faction:
                        faction,

                    points_change:
                        amount,

                    points_before:
                        before,

                    points_after:
                        after
                });

        if (logError) {
            console.error(
                "Point log failed:",
                logError
            );
        }

        showToast(
            `Added ${amount.toLocaleString()} points to ${faction}.`,
            "success"
        );

        await loadPoints();

    } catch (error) {
        console.error(
            "Add points error:",
            error
        );

        showToast(
            "Failed to add points.",
            "error"
        );
    }
}


// ========================================================
// REMOVE POINTS
// ========================================================

async function removePoints(
    faction,
    suppliedAmount
) {
    if (!currentUser) {
        showToast(
            "You must be logged in to modify points.",
            "error"
        );

        return;
    }

    const amount =
        getFactionAmount(
            faction,
            suppliedAmount
        );

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        showToast(
            "Invalid points amount.",
            "error"
        );

        return;
    }

    try {
        const {
            data: factionData,
            error: factionError
        } =
            await supabaseClient
                .from("factions")
                .select(
                    "name, points"
                )
                .eq(
                    "name",
                    faction
                )
                .single();

        if (factionError) {
            console.error(
                "Failed to find faction:",
                factionError
            );

            showToast(
                "Could not find faction.",
                "error"
            );

            return;
        }

        const before =
            Number(
                factionData.points
            ) || 0;

        const after =
            Math.max(
                0,
                before - amount
            );

        const actualChange =
            after - before;

        const {
            error: updateError
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

        if (updateError) {
            console.error(
                "Failed to update faction:",
                updateError
            );

            showToast(
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
                        currentUser.email ||
                        "Admin",

                    action:
                        "REMOVE_POINTS",

                    faction:
                        faction,

                    points_change:
                        actualChange,

                    points_before:
                        before,

                    points_after:
                        after
                });

        if (logError) {
            console.error(
                "Point log failed:",
                logError
            );
        }

        showToast(
            `Removed ${Math.abs(actualChange).toLocaleString()} points from ${faction}.`,
            "success"
        );

        await loadPoints();

    } catch (error) {
        console.error(
            "Remove points error:",
            error
        );

        showToast(
            "Failed to remove points.",
            "error"
        );
    }
}


// ========================================================
// RESET FACTION
// ========================================================

async function resetFaction(
    faction
) {
    if (!currentUser) {
        showToast(
            "You must be logged in to modify points.",
            "error"
        );

        return;
    }

    try {
        const {
            data: factionData,
            error: factionError
        } =
            await supabaseClient
                .from("factions")
                .select(
                    "name, points"
                )
                .eq(
                    "name",
                    faction
                )
                .single();

        if (factionError) {
            console.error(
                "Failed to find faction:",
                factionError
            );

            showToast(
                "Could not find faction.",
                "error"
            );

            return;
        }

        const before =
            Number(
                factionData.points
            ) || 0;

        const {
            error: updateError
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

        if (updateError) {
            console.error(
                "Failed to reset faction:",
                updateError
            );

            showToast(
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
                        currentUser.email ||
                        "Admin",

                    action:
                        "RESET",

                    faction:
                        faction,

                    points_change:
                        -before,

                    points_before:
                        before,

                    points_after:
                        0
                });

        if (logError) {
            console.error(
                "Point log failed:",
                logError
            );
        }

        showToast(
            `${faction} has been reset to 0 points.`,
            "success"
        );

        await loadPoints();

    } catch (error) {
        console.error(
            "Reset faction error:",
            error
        );

        showToast(
            "Failed to reset faction.",
            "error"
        );
    }
}


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

            showToast(
                "Failed to load faction points.",
                "error"
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
// LOGOUT
// ========================================================

async function logout() {
    try {
        const {
            error
        } =
            await supabaseClient
                .auth
                .signOut();

        if (error) {
            console.error(
                "Logout failed:",
                error
            );

            showToast(
                "Failed to log out.",
                "error"
            );

            return;
        }

        redirectToLogin();

    } catch (error) {
        console.error(
            "Logout error:",
            error
        );

        redirectToLogin();
    }
}


// ========================================================
// BUTTON EVENT LISTENERS
// ========================================================

function setupEventListeners() {
    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            logout
        );
    }

    const saveProfileButton =
        document.getElementById(
            "saveProfileButton"
        );

    if (saveProfileButton) {
        saveProfileButton.addEventListener(
            "click",
            saveProfile
        );
    }
}


// ========================================================
// START TEACHER PAGE
// ========================================================

async function startTeacherPage() {
    console.log(
        "Starting Teacher Portal..."
    );

    const loggedIn =
        await checkLogin();

    if (!loggedIn) {
        return;
    }

    setupEventListeners();

    console.log(
        "Loading teacher profile..."
    );

    await loadProfile();

    console.log(
        "Loading tags..."
    );

    await loadTags();

    console.log(
        "Loading badges..."
    );

    await loadBadges();

    console.log(
        "Loading faction points..."
    );

    await loadPoints();

    console.log(
        "Teacher Portal loaded successfully."
    );
}


// ========================================================
// START
// ========================================================

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        startTeacherPage
    );
} else {
    startTeacherPage();
}


// ========================================================
// AUTO REFRESH POINTS
// ========================================================

setInterval(
    loadPoints,
    5000
);