import { supabase } from './supabase'

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('total_wins', { ascending: false })
  if (error) throw error
  return data
}

export async function getProfileById(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createProfile(name, avatar) {
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ name, avatar, is_online: true }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(id, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function setOnlineStatus(id, isOnline) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_online: isOnline })
    .eq('id', id)
  if (error) console.error('Failed to update online status', error)
}

export async function getFriendships(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
  if (error) throw error
  return data
}

export async function addFriend(userId, friendId) {
  const { data, error } = await supabase
    .from('friendships')
    .insert([{ user_id: userId, friend_id: friendId, status: 'pending' }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function acceptFriend(friendshipId) {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
    .select()
    .single()
  if (error) throw error
  return data
}
