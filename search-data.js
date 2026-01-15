// search-data.js

export const usersDB = [
  {
    id: "u1",
    name: "User1",
    avatar: "image/user1.png",
    bio: "Room Explanation Room Explanation Room Explanation…",
    tags: ["Relaxing / Chill", "Nature & Outdoors"]
  },
  {
    id: "u2",
    name: "User2",
    avatar: "image/user2.png",
    bio: "Room Explanation",
    tags: ["Foodie Adventure"]
  },
  {
    id: "u3",
    name: "User3",
    avatar: "image/user3.png",
    bio: "Room Explanation",
    tags: ["Cultural & Historical"]
  },
  {
    id: "u4",
    name: "User4",
    avatar: "image/user4.png",
    bio: "Room Explanation",
    tags: ["Entertainment"]
  },
  {
    id: "u5",
    name: "User5",
    avatar: "image/user5.png",
    bio: "Room Explanation",
    tags: ["Nature & Outdoors", "Foodie Adventure"]
  },
  {
    id: "u6",
    name: "User6",
    avatar: "image/user6.png",
    bio: "Room Explanation",
    tags: ["Nature & Outdoors"]
  },
];

export const contentsDB = [
  {
    id: "c1",
    type: "photo",
    title: "Title",
    date: "2024.10.10",
    location: "Rome",
    tags: ["Entertainment"],
    thumbnail: "image/photo1.jpg",
    ownerId: "u1",
    bookmarked: true
  },
  {
    id: "c2",
    type: "music",
    title: "Title",
    date: "2024.11.03",
    location: "Amsterdam",
    tags: ["Relaxing / Chill"],
    thumbnail: "https://img.youtube.com/vi/rXG2d3OxIkc/hqdefault.jpg",
    ownerId: "u2",
    bookmarked: true
  },
  {
    id: "c3",
    type: "video",
    title: "Title",
    date: "2024.09.21",
    location: "Germany",
    tags: ["Cultural & Historical"],
    thumbnail: "image/video-germany-thumb.jpg",
    ownerId: "u3",
    bookmarked: true
  },
  {
    id: "c4",
    type: "video",
    title: "Title",
    date: "2024.09.21",
    location: "Germany",
    tags: ["Relaxing / Chill"],
    thumbnail: "image/photo3.jpg",
    ownerId: "u4",
    bookmarked: true
  },
  {
    id: "c5",
    type: "video",
    title: "Title",
    date: "2024.09.21",
    location: "Germany",
    tags: ["Nature & Outdoors"],
    thumbnail: "image/sea.jpg",
    ownerId: "u5",
    bookmarked: true
  },
  {
    id: "c6",
    type: "video",
    title: "Title",
    date: "2024.09.21",
    location: "Germany",
    tags: ["Foodie Adventure"],
    thumbnail: "image/kebap.jpg",
    ownerId: "u6",
    bookmarked: true
  }
  // 더보기용 계속 추가
];
