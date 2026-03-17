import { supabase } from "../../supabase/supabase";

export async function getMatches() {
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(`
      *,
      scorers!scorers_match_fk (
        id,
        player_name,
        goals
      )
    `)
    .order("fecha_partido", { ascending: true });

  if (matchesError) {
    console.error("MATCHES ERROR:", matchesError);
    console.error("message:", (matchesError as any)?.message);
    console.error("details:", (matchesError as any)?.details);
    console.error("hint:", (matchesError as any)?.hint);
    console.error("code:", (matchesError as any)?.code);
    throw matchesError;
  }

  const { data: photos, error: photosError } = await supabase
    .from("match_photos")
    .select("id, match_id, photo_url");

  if (photosError) {
    console.error("PHOTOS ERROR:", photosError);
    console.error("message:", (photosError as any)?.message);
    console.error("details:", (photosError as any)?.details);
    console.error("hint:", (photosError as any)?.hint);
    console.error("code:", (photosError as any)?.code);
    throw photosError;
  }

  const photosByMatch: Record<string, any[]> = {};

  for (const photo of photos || []) {
    const { data } = supabase.storage
      .from("match-photos")
      .getPublicUrl(photo.photo_url);

    const photoWithUrl = {
      ...photo,
      public_url: data.publicUrl,
    };

    if (!photosByMatch[photo.match_id]) {
      photosByMatch[photo.match_id] = [];
    }

    photosByMatch[photo.match_id].push(photoWithUrl);
  }

  const merged = (matches || []).map((match: any) => ({
    ...match,
    match_photos: photosByMatch[match.id] || [],
  }));

  return merged;
}

export async function createMatch(match: any) {
  const { data, error } = await supabase
    .from("matches")
    .insert(match)
    .select()
    .single();

  if (error) {
    console.error("SUPABASE CREATE MATCH ERROR RAW:", error);
    console.error("message:", (error as any)?.message);
    console.error("details:", (error as any)?.details);
    console.error("hint:", (error as any)?.hint);
    console.error("code:", (error as any)?.code);
    console.error("full error json:", JSON.stringify(error, null, 2));
    throw error;
  }

  return data;
}

export async function updateMatch(id: string, patch: any) {
  const { error } = await supabase
    .from("matches")
    .update(patch)
    .eq("id", id);

  if (error) {
    console.error("SUPABASE UPDATE MATCH ERROR RAW:", error);
    console.error("message:", (error as any)?.message);
    console.error("details:", (error as any)?.details);
    console.error("hint:", (error as any)?.hint);
    console.error("code:", (error as any)?.code);
    console.error("full error json:", JSON.stringify(error, null, 2));
    throw error;
  }
}