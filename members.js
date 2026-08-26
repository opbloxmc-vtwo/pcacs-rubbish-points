// ============================================
// SUPABASE
// ============================================

const SUPABASE_URL =
    "https://pozzgdgkqnspksidixkv.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_nHzAUpD33rmZTKttdzwDgg_Q7Cy6QZq";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ============================================
// DEFAULT AVATAR
// ============================================

const DEFAULT_AVATAR =
    "https://placehold.co/160x160?text=User";


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
// ROLE NAME
// ============================================

function roleName(role) {

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


// ============================================
// LOAD MEMBERS
// ============================================

async function loadTeachers() {

    const container =
        document.getElementById("members");


    if (!container) {

        console.error(
            "Members container not found."
        );

        return;
    }


    container.innerHTML = `
        <div class="loading">
            Loading members...
        </div>
    `;


    // ========================================
    // GET PROFILES
    // ========================================

    const {
        data,
        error
    } = await supabaseClient

        .from("profiles")

        .select(`
            id,
            display_name,
            pronouns,
            avatar_url,
            bio,
            role,

            profile_badges!profile_badges_profile_id_fkey (
                badge_id,

                badges (
                    name,
                    description,
                    icon
                )
            ),

            profile_tags!profile_tags_profile_id_fkey (
                tag_id,

                tags (
                    name,
                    description
                )
            )
        `)

        .in(
            "role",
            [
                "admin",
                "tester",
                "teacher"
            ]
        )

        .order(
            "display_name",
            {
                ascending: true
            }
        );


    // ========================================
    // ERROR
    // ========================================

    if (error) {

        console.error(
            "Failed to load members:",
            error
        );


        container.innerHTML = `
            <div class="error">

                Failed to load members.

                <br><br>

                ${escapeHtml(error.message)}

            </div>
        `;

        return;
    }


    // ========================================
    // NO MEMBERS
    // ========================================

    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML = `
            <div class="empty">

                No members found.

            </div>
        `;

        return;
    }


    // ========================================
    // CLEAR
    // ========================================

    container.innerHTML = "";


    // ========================================
    // CREATE CARDS
    // ========================================

    data.forEach(profile => {


        const name =
            profile.display_name ||
            "Unnamed User";


        const avatar =
            profile.avatar_url ||
            DEFAULT_AVATAR;


        const role =
            roleName(profile.role);


        // ====================================
        // BADGES
        // ====================================

        let badges = "";


        if (
            profile.profile_badges &&
            profile.profile_badges.length > 0
        ) {

            badges =
                profile.profile_badges

                    .map(item => {

                        const badge =
                            item.badges;


                        if (!badge) {
                            return "";
                        }


                        return `
                            <span class="badge">

                                ${escapeHtml(
                                    badge.icon || "🏅"
                                )}

                                ${escapeHtml(
                                    badge.name
                                )}

                            </span>
                        `;

                    })

                    .join("");

        }


        // ====================================
        // TAGS
        // ====================================

        let tags = "";


        if (
            profile.profile_tags &&
            profile.profile_tags.length > 0
        ) {

            tags =
                profile.profile_tags

                    .map(item => {

                        const tag =
                            item.tags;


                        if (!tag) {
                            return "";
                        }


                        return `
                            <span class="tag">

                                ${escapeHtml(
                                    tag.name
                                )}

                            </span>
                        `;

                    })

                    .join("");

        }


        // ====================================
        // CARD
        // ====================================

        const card =
            document.createElement("div");


        card.className =
            "member";


        card.innerHTML = `

            <img
                class="avatar"
                src="${escapeHtml(avatar)}"
                alt="Profile picture"
            >


            <div class="member-info">


                <h2 class="member-name">

                    ${escapeHtml(name)}

                </h2>


                ${
                    profile.pronouns

                    ? `

                        <div class="pronouns">

                            ${escapeHtml(
                                profile.pronouns
                            )}

                        </div>

                    `

                    : ""
                }


                ${
                    profile.bio

                    ? `

                        <div class="bio">

                            ${escapeHtml(
                                profile.bio
                            )}

                        </div>

                    `

                    : ""
                }


                <div>

                    <span
                        class="
                            role
                            role-${escapeHtml(
                                profile.role
                            )}
                        "
                    >

                        ${escapeHtml(role)}

                    </span>

                </div>


                ${
                    tags

                    ? `

                        <div class="tags">

                            ${tags}

                        </div>

                    `

                    : ""
                }


                ${
                    badges

                    ? `

                        <div class="badges">

                            ${badges}

                        </div>

                    `

                    : ""
                }


            </div>

        `;


        // ====================================
        // AVATAR ERROR
        // ====================================

        const image =
            card.querySelector(".avatar");


        image.onerror =
            function () {

                image.onerror = null;

                image.src =
                    DEFAULT_AVATAR;

            };


        // ====================================
        // ADD CARD
        // ====================================

        container.appendChild(card);

    });

}


// ============================================
// INITIAL LOAD
// ============================================

loadTeachers();


// ============================================
// REFRESH EVERY 30 SECONDS
// ============================================

setInterval(
    loadTeachers,
    30000
);