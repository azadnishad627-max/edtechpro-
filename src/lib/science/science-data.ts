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
        description: "मस्तिष्क का यह आगे का हिस्सा हमारी योजना बनाने, सोचने-समझने, निर्णय लेने, हमारी पर्सनालिटी (व्यक्तित्व) और शरीर की ऐच्छिक गतिविधियों को नियंत्रित करता है।"
      },
      {
        id: "motor_cortex",
        position: [-0.2, 1.15, 0.7],
        title: "मोटर कॉर्टेक्स (Motor Cortex)",
        description: "यह हिस्सा फ्रंटल लोब के ठीक पीछे होता है। यह हमारे शरीर की सभी मांसपेशियों की गति (movement) को सिग्नल भेजकर कंट्रोल करता है।"
      },
      {
        id: "parietal",
        position: [0.25, 1.1, 0.65],
        title: "पैराइटल लोब (Parietal Lobe)",
        description: "यह हिस्सा त्वचा से मिलने वाली संवेदनाओं जैसे स्पर्श, दबाव, तापमान और दर्द को समझने का मुख्य केंद्र है।"
      },
      {
        id: "temporal",
        position: [0.55, -0.1, 0.82],
        title: "टेम्पोरल लोब (Temporal Lobe)",
        description: "कानों के ठीक पास स्थित यह हिस्सा हमारी सुनने की क्षमता, भाषा समझने और पुरानी याददाश्त (memory) को स्टोर करने का काम करता है।"
      },
      {
        id: "occipital",
        position: [1.1, 0.2, 0.5],
        title: "ऑक्सीपिटल लोब (Occipital Lobe)",
        description: "मस्तिष्क के सबसे पीछे का यह हिस्सा हमारी आंखों से आने वाले सिग्नल्स को प्रोसेस करता है। इसी की मदद से हम चीजों को देख और पहचान पाते हैं।"
      },
      {
        id: "cerebellum",
        position: [0.72, -0.9, 0.55],
        title: "सेरेबेलम (Cerebellum)",
        description: "इसे 'छोटा दिमाग' भी कहा जाता है। यह शरीर का संतुलन (balance) बनाए रखने और मांसपेशियों के बीच तालमेल बिठाने का काम करता है।"
      },
      {
        id: "brain_stem",
        position: [0.2, -1.2, 0.5],
        title: "ब्रेन स्टेम (Brain Stem)",
        description: "यह मस्तिष्क को रीढ़ की हड्डी से जोड़ता है। यह सांस लेने, दिल की धड़कन और ब्लड प्रेशर जैसे जीवन रक्षक स्वचालित कार्यों को कंट्रोल करता है।"
      }
    ]
  }
];

export const getModelById = (id: string): ScienceModel | undefined => {
  return scienceModels.find(m => m.id === id);
};
