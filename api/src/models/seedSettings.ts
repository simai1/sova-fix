import Settings from "./settings";

export const seedInitialSettings = async () => {
  const defaultSettings = [
    {
      setting: 'is_repair_request_with_photo',
      value: true,
      name: 'Заявка без фото'
    },
  ];

  for (const setting of defaultSettings) {
    const [record, created] = await Settings.findOrCreate({
      where: { setting: setting.setting },
      defaults: setting,
    });

    if (created) {
      console.log(`INFO: Setting "${setting.setting}" created.`);
    }
  }
};