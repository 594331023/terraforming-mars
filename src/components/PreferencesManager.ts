export class PreferencesManager {
    static keys: Array<string> = [
      'hide_corporation',
      'hide_hand',
      'hide_cards',
      'hide_awards_and_milestones',
      'hide_tag_overview',
      'hide_turnorder',
      'hide_corporation_names',
      'hide_top_bar',
      'small_cards',
      'remove_background',
      'magnify_cards',
      'magnify_card_descriptions',
      'show_alerts',
      'hide_ma_scores',
      'hide_non_blue_cards',
      'hide_active_cards',
      'hide_automated_cards',
      'hide_event_cards',
      'hide_log',
      'lang',
      'enable_sounds',
      'smooth_scrolling',
      'hide_tile_confirmation',
      'show_card_number',
      'show_discount_on_cards',
      'tutorial_mode',
    ];

    static preferencesValues: Map<string, boolean | string> = new Map<string, boolean | string>();
    private static localStorageSupported(): boolean {
      return typeof localStorage !== 'undefined';
    }


    static saveValue(name: string, val: string): void {
      if ( ! PreferencesManager.localStorageSupported()) return;
      localStorage.setItem(name, val);
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * userId
     * userName
     * soundtip
     * lastcreated  最后一次创建游戏的时间
     * input  exec输入
     * vip         是否vip
     * vipupdate   vip更新时间
     * donateupdate  赞助页面显示时间
     */
    static loadValue(name: string): string {
      if ( ! PreferencesManager.localStorageSupported()) return '';
      const value = localStorage.getItem(name);
      if (value === null) return '';
      return value;
    }

    static loginOUt() {
      if ( ! PreferencesManager.localStorageSupported) return;
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('vip');
      localStorage.removeItem('vipupdate');
    }
}
