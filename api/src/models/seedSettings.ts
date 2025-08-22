import Settings from "./settings";

export const seedInitialSettings = async () => {
  const defaultSettings = [
    {
      setting: 'is_repair_request_without_photo',
      value: true,
      name: 'Обязательно с фото',
    },
    {
      setting: 'is_auto_set_category',
      value: false,
      name: 'Автоматизация'
    }
  ];

  for (const defaultSetting of defaultSettings) {
    const existing = await Settings.findOne({
      where: { setting: defaultSetting.setting },
    });

    if (!existing) {
      await Settings.create(defaultSetting);
      console.log(`INFO: Setting "${defaultSetting.setting}" created.`);
    } else if (existing.name !== defaultSetting.name) {
      await existing.update({ name: defaultSetting.name });
      console.log(`INFO: Setting "${defaultSetting.setting}" name updated.`);
    }
  }
};
