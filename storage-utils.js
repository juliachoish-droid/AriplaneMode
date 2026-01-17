
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
  return getList(KEY_FOLLOWED_ROOMS);
}

export function isRoomFollowed(userId){
  return getFollowedRoomIds().includes(String(userId));
}
export function toggleRoomFollow(userId){
  return toggleInList(KEY_FOLLOWED_ROOMS, userId);
}
