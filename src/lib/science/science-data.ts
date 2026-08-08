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
    description: "This is a placeholder for a custom 3D Science model. You can add your own `.glb` models to the public/models directory and update this file to display them.",
    fileUrl: "/models/brain.glb",
    scale: 1,
    cameraPosition: [0, 0, 5],
    hotspots: [
      {
        id: "demo-hotspot",
        position: [0, 1, 0],
        title: "Demo Label",
        description: "Hotspots can be added to any part of your model by specifying XYZ coordinates."
      }
    ]
  }
];

export const getModelById = (id: string): ScienceModel | undefined => {
  return scienceModels.find(m => m.id === id);
};
