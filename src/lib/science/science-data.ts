export type Hotspot = {
  id: string;
  position: [number, number, number];
  title: string;
  description: string;
};

export type ScienceModel = {
  id: string;
  name: string;
  description: string;
  fileUrl: string;
  scale?: number;
  cameraPosition?: [number, number, number];
  hotspots?: Hotspot[];
};

export const scienceModels: ScienceModel[] = [
  {
    id: "brain-demo",
    name: "Demo: Brain Model",
    description: "यह एक कस्टम 3D साइंस मॉडल है। आप नीचे दिए गए हॉटस्पॉट (बिंदुओं) पर क्लिक करके मस्तिष्क (Brain) के अलग-अलग हिस्सों के बारे में हिंदी में जानकारी प्राप्त कर सकते हैं।",
    fileUrl: "/models/brain.glb",
    scale: 1,
    cameraPosition: [0, 0, 5],
    hotspots: [
      {
        id: "frontal",
        position: [-0.7, 0.65, 0.8],
        title: "फ्रंटल लोब (Frontal Lobe)",
        description: "यह हिस्सा हमारी योजना बनाने, सोचने-समझने, निर्णय लेने और शरीर की गति (movement) को नियंत्रित करने का काम करता है।"
      },
      {
        id: "parietal",
        position: [0.15, 1.1, 0.65],
        title: "पैराइटल लोब (Parietal Lobe)",
        description: "यह हिस्सा स्पर्श, तापमान और दर्द जैसी शारीरिक संवेदनाओं (senses) को समझने और उन्हें प्रोसेस करने का केंद्र है।"
      },
      {
        id: "temporal",
        position: [0.75, -0.1, 0.82],
        title: "टेम्पोरल लोब (Temporal Lobe)",
        description: "यह हिस्सा हमारी याददाश्त (memory) को स्टोर करने और कानों से सुनी गई बातों को समझने में मदद करता है।"
      },
      {
        id: "cerebellum",
        position: [0.72, -0.9, 0.55],
        title: "सेरेबेलम (Cerebellum)",
        description: "इसे 'छोटा दिमाग' भी कहा जाता है। यह शरीर का संतुलन (balance) बनाए रखने और मांसपेशियों के बीच तालमेल बिठाने का काम करता है।"
      }
    ]
  }
];

export const getModelById = (id: string): ScienceModel | undefined => {
  return scienceModels.find(m => m.id === id);
};
