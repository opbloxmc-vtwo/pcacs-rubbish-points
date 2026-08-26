async function giveBadge(
    profileId,
    badgeId
) {

    const {
        data: {
            user
        }
    } =
        await supabaseClient.auth.getUser();


    if (!user) {
        throw new Error("Not logged in.");
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
                    badgeId,

                given_by:
                    user.id

            });


    if (error) {
        throw error;
    }
}


async function removeBadge(
    profileId,
    badgeId
) {

    const {
        error
    } =
        await supabaseClient

            .from("profile_badges")

            .delete()

            .eq(
                "profile_id",
                profileId
            )

            .eq(
                "badge_id",
                badgeId
            );


    if (error) {
        throw error;
    }
}


async function getBadges() {

    const {
        data,
        error
    } =
        await supabaseClient

            .from("badges")

            .select("*")

            .order(
                "name"
            );


    if (error) {
        throw error;
    }


    return data;
}