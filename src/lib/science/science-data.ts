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
  fileUrl?: string;
  sketchfabId?: string;
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
  },
  {
    id: "heart",
    name: "Heart (हृदय)",
    description: "मानव हृदय एक मांसपेशीय अंग है जो पूरे शरीर में रक्त पंप करता है। यह ऑक्सीजन और पोषक तत्वों को सभी अंगों तक पहुँचाने का काम करता है।",
    fileUrl: "/models/heart.glb",
    scale: 1,
    cameraPosition: [0, 0, 5],
  },
  {
    id: "lungs",
    name: "Lungs (फेफड़े)",
    description: "फेफड़े श्वसन प्रणाली का मुख्य अंग हैं। ये हवा से ऑक्सीजन खींचकर रक्त में मिलाते हैं और कार्बन डाइऑक्साइड को शरीर से बाहर निकालते हैं।",
    fileUrl: "/models/lungs.glb",
    scale: 1,
    cameraPosition: [0, 0, 5],
  },
  {
    id: "eyeball",
    name: "Eye (आंख)",
    description: "आंख हमारे शरीर का कैमरा है। यह प्रकाश को कैप्चर करके दृष्टि तंत्रिकाओं के माध्यम से मस्तिष्क तक सिग्नल भेजती है।",
    fileUrl: "/models/eyeball.glb",
    scale: 1,
    cameraPosition: [0, 0, 5],
  },
  {
    id: "kidneys",
    name: "Kidneys (गुर्दे)",
    description: "गुर्दे रक्त को फिल्टर करके शरीर से अपशिष्ट (waste) और अतिरिक्त पानी को मूत्र के रूप में बाहर निकालते हैं।",
    fileUrl: "/models/kidneys.glb",
    scale: 1,
    cameraPosition: [0, 0, 5],
  },
  {
    id: "liver",
    name: "Liver (यकृत)",
    description: "लिवर शरीर का सबसे बड़ा आंतरिक अंग है। यह भोजन पचाने, विषैले तत्वों को बाहर निकालने और ऊर्जा स्टोर करने का काम करता है।",
    fileUrl: "/models/liver.glb",
    scale: 1,
    cameraPosition: [0, 0, 5],
  },
  {
    id: "pancreas",
    name: "Pancreas (अग्न्याशय)",
    description: "पैंक्रियाज इंसुलिन बनाता है जो ब्लड शुगर को कंट्रोल करता है, और पाचन में मदद करने वाले एंजाइम भी बनाता है।",
    fileUrl: "/models/pancreas.glb",
    scale: 1,
    cameraPosition: [0, 0, 5],
  },
  {
    id: "skin",
    name: "Skin Anatomy (त्वचा)",
    description: "त्वचा शरीर का सबसे बड़ा अंग है जो हमें बाहरी वातावरण से बचाता है और शरीर का तापमान नियंत्रित करता है।",
    fileUrl: "/models/skin.glb",
    scale: 1,
    cameraPosition: [0, 0, 5],
  },
  {
    id: "intestine",
    name: "Intestines (आंतें)",
    description: "आंतें (छोटी और बड़ी) भोजन को पूरी तरह से पचाने और उसमें से पोषक तत्वों को सोखने (absorb) का काम करती हैं।",
    fileUrl: "/models/intestine.glb",
    scale: 1,
    cameraPosition: [0, 0, 5],
  },
  {
    id: "plant-cell",
    name: "Plant Cell (पादप कोशिका)",
    description: "Sketchfab 3D Model: पादप कोशिका में एक कठोर कोशिका भित्ति (Cell Wall) और क्लोरोप्लास्ट (Chloroplast) होता है जो प्रकाश संश्लेषण में मदद करता है।",
    sketchfabId: "06c34533b4f441569bfa207aff7c8a19",
  },
  {
    id: "animal-cell",
    name: "Animal Cell (जंतु कोशिका)",
    description: "Sketchfab 3D Model: जंतु कोशिका में कोशिका भित्ति नहीं होती है। इसमें न्यूक्लियस (केंद्रक) और माइटोकॉन्ड्रिया (Mitochondria) जैसे अंग होते हैं।",
    sketchfabId: "abaa9a651c834cdaa67072b32fb0024f",
  },
  {
    id: "dna",
    name: "DNA Structure (डीएनए)",
    description: "Sketchfab 3D Model: डीएनए (Deoxyribonucleic acid) वह अणु है जो सभी जीवों के आनुवंशिक (genetic) निर्देशों को अपने अंदर सुरक्षित रखता है।",
    sketchfabId: "60e95170b37549e3b45ee490b74bb112",
  }
];

export const getModelById = (id: string): ScienceModel | undefined => {
  return scienceModels.find(m => m.id === id);
};
