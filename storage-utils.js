/*
 * DEPRECATED
 * This file was used in an early prototype where content details
 * were opened on a separate page (detail.html).
 *
 * The final implementation integrates content details
 * as an overlay inside Room.html using deep linking (?content=).
 *
 * This file is kept for documentation purposes only.
 */

// storage-utils.js
const KEY_SAVED_CONTENTS = "saved_contents";   // ["c1","c3"]
const KEY_FOLLOWED_ROOMS = "followed_rooms";   // ["u2","u5"]

function initKey(key){
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify([]));
  }
}

function getList(key){
  initKey(key);
  return JSON.parse(localStorage.getItem(key) || "[]").map(String);
}

function setList(key, arr){
  localStorage.setItem(key, JSON.stringify(arr.map(String)));
}

function toggleInList(key, id){
  const target = String(id);
  const list = getList(key);
  const exists = list.includes(target);
  const next = exists ? list.filter(x => x !== target) : [...list, target];
  setList(key, next);
  return !exists; // true=now saved/followed
}

// ===== Contents (Bookmark) =====
export function getSavedContentIds(){
  return getList(KEY_SAVED_CONTENTS);
}
export function isContentSaved(contentId){
  return getSavedContentIds().includes(String(contentId));
}
export function toggleContentSaved(contentId){
  return toggleInList(KEY_SAVED_CONTENTS, contentId);
}

// ===== Rooms (Follow) =====
export function getFollowedRoomIds(){
  try {
    const raw = localStorage.getItem("followed_rooms");
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

export function isRoomFollowed(userId){
  return getFollowedRoomIds().includes(String(userId));
}
export function toggleRoomFollow(userId){
  return toggleInList(KEY_FOLLOWED_ROOMS, userId);
}
