(function () {
    "use strict";

    let client;

    function getClient() {
        const config = window.NTUCUP_CONFIG || {};
        if (!config.supabaseUrl || !config.supabaseAnonKey) {
            throw new Error("Supabase is not configured. Add the project URL and anon key to src/config.js.");
        }
        if (!window.supabase?.createClient) {
            throw new Error("The Supabase browser library did not load.");
        }
        if (!client) client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
        return client;
    }

    function normalizeSlug(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 64);
    }

    async function getUser() {
        const { data, error } = await getClient().auth.getUser();
        if (error) throw error;
        return data.user;
    }

    async function requireUser(loginPath = "login.html") {
        const user = await getUser();
        if (!user) {
            const next = encodeURIComponent(location.pathname + location.search);
            location.replace(`${loginPath}?next=${next}`);
            return null;
        }
        return user;
    }

    async function signIn(email, password) {
        const { data, error } = await getClient().auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    }

    async function signUp(email, password) {
        const { data, error } = await getClient().auth.signUp({ email, password });
        if (error) throw error;
        return data;
    }

    async function signOut() {
        const { error } = await getClient().auth.signOut();
        if (error) throw error;
    }

    async function listOwnedPublications() {
        const user = await getUser();
        if (!user) throw new Error("Sign in before loading publications.");
        const { data, error } = await getClient()
            .from("tournament_publications")
            .select("id, slug, name, is_public, updated_at")
            .eq("owner_id", user.id)
            .order("updated_at", { ascending: false });
        if (error) throw error;
        return data || [];
    }

    async function publishLocalTournament({ slug, name, isPublic = true }) {
        const user = await getUser();
        if (!user) throw new Error("Sign in before publishing.");
        const safeSlug = normalizeSlug(slug);
        if (!safeSlug) throw new Error("Enter a public slug using letters, numbers, or hyphens.");
        const snapshot = window.exportTournamentBackup();
        const payload = {
            owner_id: user.id,
            slug: safeSlug,
            name: String(name || safeSlug).trim().slice(0, 120),
            data: snapshot,
            is_public: Boolean(isPublic)
        };
        const { data, error } = await getClient()
            .from("tournament_publications")
            .upsert(payload, { onConflict: "slug" })
            .select("id, slug, name, is_public, updated_at")
            .single();
        if (error) throw error;
        return data;
    }

    async function loadOwnedPublication(slug) {
        const user = await getUser();
        if (!user) throw new Error("Sign in before loading publications.");
        const { data, error } = await getClient()
            .from("tournament_publications")
            .select("data")
            .eq("slug", normalizeSlug(slug))
            .eq("owner_id", user.id)
            .single();
        if (error) throw error;
        window.importTournamentBackup(data.data);
        return data.data;
    }

    async function listPublications() {
        const { data, error } = await getClient()
            .from("tournament_publications")
            .select("slug, name, updated_at")
            .eq("is_public", true)
            .order("updated_at", { ascending: false });
        if (error) throw error;
        return data || [];
    }

    async function getPublicPublication(slug) {
        const { data, error } = await getClient()
            .from("tournament_publications")
            .select("slug, name, data, updated_at")
            .eq("slug", normalizeSlug(slug))
            .eq("is_public", true)
            .single();
        if (error) throw error;
        return data;
    }

    window.NTUCUPCloud = {
        getClient,
        normalizeSlug,
        getUser,
        requireUser,
        signIn,
        signUp,
        signOut,
        listOwnedPublications,
        publishLocalTournament,
        loadOwnedPublication,
        listPublications,
        getPublicPublication
    };
})();
