// Imran's Private Memories Database

const privateMemories = [
  { 
    id: 1, 
    url: "pictures/1.jpg", 
    caption: "কলেজের শহীদ মিনারে বসে আছি", 
    categories: ["my-college", "pleasure-time"] 
  },
  { 
    id: 2, 
    url: "pictures/2.png", 
    caption: "সুন্দর একটা বিকাল কাটালাম। 🤏🏻😌", 
    categories: ["pleasure-time"] 
  },
  { 
    id: 3, 
    url: "pictures/3.jpg", 
    caption: "চেনা পরিবেশের মাঝে এক টুকরো প্রশান্তি। শহীদ মিনারে দাঁড়িয়ে কাটানো একটি সুন্দর বিকেল। 🌿", 
    categories: ["pleasure-time"] 
  },
  { 
    id: 4, 
    url: "pictures/4.jpg", 
    caption: "কোলাহল থেকে দূরে, ঈদের দিনটা একটু নিজের মতো করে। ছাদে বসে আকাশ দেখার আনন্দই আলাদা। ❤️", 
    categories: ["eid-special"] 
  },
  { 
    id: 5, 
    url: "pictures/5.jpg", 
    caption: "মাঠে প্লেয়ার থাকুক আর না থাকুক, গ্যালারিতে বসে আমাদের এই লুকটাই কিন্তু পুরো স্টেডিয়াম কাঁপানোর জন্য যথেষ্ট! 😎🚀", 
    categories: ["ru", "rajshahi"] 
  },
  { 
    id: 6, 
    url: "pictures/6.png", 
    caption: "ঈদ মোবারক! ✨", 
    categories: ["eid-special"] 
  },
  { 
    id: 7, 
    url: "pictures/7.png", 
    caption: "নতুন পোশাক, প্রিয় মানুষদের হাসিমুখ আর এক বুক আনন্দ—এই তো ঈদের আসল সার্থকতা। ঈদ মোবারক! ✨", 
    categories: ["eid-special"] 
  },
  { 
    id: 8, 
    url: "pictures/8.jpg", 
    caption: "ব্যস্ত সূচির মাঝে কয়েক সেকেন্ডের এই শান্ত থামা। শেখ মুজিবুর রহমান হলের এই চেনা পথটুকুও ক্যাম্পাসের এক একটি সুন্দর স্মৃতির অংশ।", 
    categories: ["dhaka-university-shahid-osman-hadi-hall", "dhaka"] 
  },
  { 
    id: 9, 
    url: "pictures/9.jpg", 
    caption: "উদ্যানের গাছপালাও সবুজ, আর আমার লুকটাও আজকে পুরাই ফ্রেশ। একটু অক্সিজেন নিয়ে আবার শহরের ব্যস্ততায় ফেরা। 🚀🌿", 
    categories: ["dhaka-zia-park", "dhaka"] 
  },
  { 
    id: 10, 
    url: "pictures/10.png", 
    caption: "ঐতিহ্যের আঙিনায় কিছুক্ষণের পথচলা। ঢাকা বিশ্ববিদ্যালয় ক্যাম্পাস মানেই তো এক বুক আবেগ আর হাজারো গল্পের মেলা। ✨", 
    categories: ["du", "dhaka"] 
  },
  { 
    id: 11, 
    url: "pictures/11.jpg", 
    caption: "কোলাহল থামিয়ে শহর যখন শান্ত, তখন এক জায়গায় বসে রাত দেখার আনন্দই আলাদা। যশোরের এই রাতগুলো বড্ড প্রিয়। 🏙️❤️", 
    categories: ["jashore", "admission-time"] 
  },
  { 
    id: 12, 
    url: "pictures/12.png", 
    caption: "সবুজে ঘেরা ক্যাম্পাস আর এক বুক প্রশান্তি। খুলনা বিশ্ববিদ্যালয়ের এই চত্বরে দাঁড়িয়ে থমকে যাক কিছুটা সময়। 🌿", 
    categories: ["khulna", "admission-time"] 
  },
  { 
    id: 13, 
    url: "pictures/13.jpg", 
    caption: "আকাশের দিকে শান্ত দৃষ্টি, কিন্তু লক্ষ্যটা আকাশ ছোঁয়া।", 
    categories: ["jashore"] 
  },
  { 
    id: 14, 
    url: "pictures/14.png", 
    caption: "শত বছরের ইতিহাসের সাক্ষী এই কালেক্টর ভবন। পুরোনো এই দেওয়ালে হেলান দিয়েই যেন ফিরে পাওয়া এক টুকরো নীরব শান্তি।", 
    categories: ["jashore"] 
  },
  { 
    id: 15, 
    url: "pictures/15.png", 
    caption: "আধুনিকতার ভিড়ে এক টুকরো অতীত। এই পুরোনো দেওয়ালগুলোর পরতে পরতে যেন লুকিয়ে আছে আভিজাত্য।", 
    categories: ["dhaka"] 
  },
   {
    id: 16, 
    url: "pictures/16.jpg", 
    caption: "শান্ত বিকেলে নিজের সাথে কিছু মুহূর্ত।", 
    categories: ["pleasure-time"] 
  },
   {
    id: 16, 
    url: "pictures/17.jpg", 
    caption: "", 
    categories: ["dhaka"] 
      },
      {
    id: 16, 
    url: "pictures/18.jpg", 
    caption: "", 
    categories: ["dhaka"] 
      },
      {
    id: 16, 
    url: "pictures/19.jpg", 
    caption: "", 
    categories: ["jashore"] 
}
];

// Global exposure for index.html
window.privateMemories = privateMemories;
