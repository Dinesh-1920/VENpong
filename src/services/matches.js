import { supabase } from './supabase'

export async function createMatch(matchData) {
  const { data, error } = await supabase
    .from('matches')
    .insert([{ ...matchData, team_a_score: 0, team_b_score: 0, status: 'active' }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMatchScore(matchId, teamAScore, teamBScore) {
  const { data, error } = await supabase
    .from('matches')
    .update({ team_a_score: teamAScore, team_b_score: teamBScore })
    .eq('id', matchId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function endMatch(matchId, teamAScore, teamBScore, winner) {
  const { data, error } = await supabase
    .from('matches')
    .update({ team_a_score: teamAScore, team_b_score: teamBScore, winner, status: 'completed' })
    .eq('id', matchId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getRecentMatches(limit = 20) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function getMatchById(matchId) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single()
  if (error) throw error
  return data
}

export async function getPlayerMatches(playerId) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'completed')
    .or(
      `team_a_player1_id.eq.${playerId},team_a_player2_id.eq.${playerId},team_b_player1_id.eq.${playerId},team_b_player2_id.eq.${playerId}`
    )
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updatePlayerStats(winnerId1, winnerId2, loserId1, loserId2) {
  const promises = []

  if (winnerId1) {
    promises.push(
      supabase.rpc('increment_wins', { player_id: winnerId1 }).catch(() =>
        supabase.from('profiles').select('total_wins').eq('id', winnerId1).single().then(({ data }) =>
          supabase.from('profiles').update({ total_wins: (data?.total_wins || 0) + 1 }).eq('id', winnerId1)
        )
      )
    )
  }
  if (winnerId2) {
    promises.push(
      supabase.from('profiles').select('total_wins').eq('id', winnerId2).single().then(({ data }) =>
        supabase.from('profiles').update({ total_wins: (data?.total_wins || 0) + 1 }).eq('id', winnerId2)
      )
    )
  }
  if (loserId1) {
    promises.push(
      supabase.from('profiles').select('total_losses').eq('id', loserId1).single().then(({ data }) =>
        supabase.from('profiles').update({ total_losses: (data?.total_losses || 0) + 1 }).eq('id', loserId1)
      )
    )
  }
  if (loserId2) {
    promises.push(
      supabase.from('profiles').select('total_losses').eq('id', loserId2).single().then(({ data }) =>
        supabase.from('profiles').update({ total_losses: (data?.total_losses || 0) + 1 }).eq('id', loserId2)
      )
    )
  }

  await Promise.all(promises)
}
