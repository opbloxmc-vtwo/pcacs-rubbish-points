async function getTags() {

    const {
        data,
        error
    } =
        await supabaseClient

            .from("tags")

            .select("*")

            .order("name");


    if (error) {
        throw error;
    }


    return data;
}


async function assignTag(
    profileId,
    tagId
) {

    const {
        data: {
            user
        }
    } =
        await supabaseClient.auth.getUser();


    if (!user) {
        throw new Error(
            "You must be logged in."
        );
    }


    const {
        error
    } =
        await supabaseClient

            .from("profile_tags")

            .insert({

                profile_id:
                    profileId,

                tag_id:
                    tagId,

                assigned_by:
                    user.id

            });


    if (error) {
        throw error;
    }
}


async function removeTag(
    profileId,
    tagId
) {

    const {
        error
    } =
        await supabaseClient

            .from("profile_tags")

            .delete()

            .eq(
                "profile_id",
                profileId
            )

            .eq(
                "tag_id",
                tagId
            );


    if (error) {
        throw error;
    }
}