async function createBadge(
    name,
    description,
    icon
) {

    const {
        data,
        error
    } =
        await supabaseClient

            .from("badges")

            .insert({

                name:
                    name.trim(),

                description:
                    description.trim(),

                icon:
                    icon.trim()

            })

            .select()

            .single();


    if (error) {
        throw error;
    }


    return data;
}


async function updateBadge(
    badgeId,
    name,
    description,
    icon
) {

    const {
        data,
        error
    } =
        await supabaseClient

            .from("badges")

            .update({

                name:
                    name.trim(),

                description:
                    description.trim(),

                icon:
                    icon.trim()

            })

            .eq(
                "id",
                badgeId
            )

            .select()

            .single();


    if (error) {
        throw error;
    }


    return data;
}


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
        throw error;
    }
}