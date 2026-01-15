import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabase = createClient(
  "https://krmdylpesyfmbjumprqs.supabase.co",
  "sb_publishable_RJUBp-CBpDZebQ6IE3KSqA_oTLAxG-6"
);

// 👇 여기다 네 데이터 그대로 붙여도 됨 (id만 제거)
const seed = [
  // music
  {
    ownerId:"me",
    type:"music",
    title:"죠지-So much",
    location:"South Korea",
    date:"2024.12.21",
    thumbnail:"https://img.youtube.com/vi/rXG2d3OxIkc/hqdefault.jpg",
    moodTags:["Relaxing / Chill"],
    memory:"네덜란드 오기 전 가장 많이 들었던 노래! 마음이 편해지는 멜로디."
  },
  {
    ownerId:"me",
    type:"music",
    title:"Music Content2",
    location:"Amsterdam",
    date:"2024.11.03",
    thumbnail:"https://img.youtube.com/vi/P-KgK8Gf70g/hqdefault.jpg",
    moodTags:["Relaxing / Chill"],
    memory:"네덜란드 오기 전 가장 많이 들었던 노래! 마음이 편해지는 멜로디."
  },

  // gallery
  {
    ownerId:"me",
    type:"gallery",
    title:"Photo Content1",
    location:"Germany",
    date:"2024.10.10",
    thumbnail:"https://krmdylpesyfmbjumprqs.supabase.co/storage/v1/object/public/media/contents/images/IMG_1825.JPG",
    moodTags:["Entertainment"],
    memory:"내가 본 픽토그램 중 가장 신나보이는 픽토그램."
  },

  // video
  {
    ownerId:"me",
    type:"video",
    title:"Take a train in Germany",
    location:"Germany",
    date:"2024.09.21",
    thumbnail:"https://krmdylpesyfmbjumprqs.supabase.co/storage/v1/object/public/media/contents/video/video-germany-thumb.jpg",
    videoSrc:"https://krmdylpesyfmbjumprqs.supabase.co/storage/v1/object/public/media/contents/video/germany.mp4",
    moodTags:["Cultural & Historical"],
    memory:"기차 타는 방법부터 처음 배워야하는 해외여행의 재미."
  }
];

async function run(){
  const { data, error } = await supabase
    .from("contents")
    .insert(seed)
    .select();

  if (error) {
    console.error("❌ insert failed", error);
  } else {
    // console.log("✅ insert success", data);
  }
}

run();
