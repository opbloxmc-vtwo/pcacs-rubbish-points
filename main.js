// ============================================
// SUPABASE CONFIGURATION
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
// LOAD POINTS
// ============================================

async function loadPoints() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("factions")
            .select("name, points");


    if (error) {

        console.error(
            "Failed to load points:",
            error
        );

        return;

    }


    data.forEach(function(faction) {

        const element =
            document.getElementById(
                faction.name + "Points"
            );


        if (element) {

            element.textContent =
                faction.points.toLocaleString();

        }

    });

}


// ============================================
// INITIAL LOAD
// ============================================

loadPoints();


// ============================================
// AUTOMATIC REFRESH
// ============================================

setInterval(function() {

    loadPoints();

}, 2000);
