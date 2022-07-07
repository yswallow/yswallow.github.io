const KEYCODES= [
    "KC_NO",
    false,
    false,
    false,
    "KC_A",
    "KC_B",
    "KC_C",
    "KC_D",
    "KC_E",
    "KC_F",
    "KC_G",
    "KC_H",
    "KC_I",
    "KC_J",
    "KC_K",
    "KC_L",
    "KC_M",
    "KC_N",
    "KC_O",
    "KC_P",
    "KC_Q",
    "KC_R",
    "KC_S",
    "KC_T",
    "KC_U",
    "KC_V",
    "KC_W",
    "KC_X",
    "KC_Y",
    "KC_Z",
    "KC_1",
    "KC_2",
    "KC_3",
    "KC_4",
    "KC_5",
    "KC_6",
    "KC_7",
    "KC_8",
    "KC_9",
    "KC_0",
    "KC_ENTER",
    "KC_ESCAPE",
    "KC_BSPACE",
    "KC_TAB",
    "KC_SPACE",
    "KC_MINUS",
    "KC_EQUAL",
    "KC_LBRC",
    "KC_RBRC",
    "KC_BSLS",
    "KC_NONUS_HASH",
    "KC_SCLN",
    "KC_QUOTE",
    "KC_GRAVE",
    "KC_COMMA",
    "KC_DOT",
    "KC_SLASH",
    "KC_CAPS",
    "KC_F1",
    "KC_F2",
    "KC_F3",
    "KC_F4",
    "KC_F5",
    "KC_F6",
    "KC_F7",
    "KC_F8",
    "KC_F9",
    "KC_F10",
    "KC_F11",
    "KC_F12",
    "KC_PSCR",
    "KC_SCRL",
    "KC_PAUSE",
    "KC_INSERT",
    "KC_HOME",
    "KC_PGUP",
    "KC_DELETE",
    "KC_END",
    "KC_PGDN",
    "KC_RIGHT",
    "KC_LEFT",
    "KC_DOWN",
    "KC_UP",
    "KC_NUM_LOCK" /* 0x53 */
]

const MODIFIERS = [
    "KC_LCTL",
    "KC_LSFT",
    "KC_LALT",
    "KC_LGUI",
    "KC_RCTL",
    "KC_RSFT",
    "KC_RALT",
    "KC_RGUI"
]

function getKeynameFallback( hex16bit ) {
    return "0x"+hex16bit.toString(16);
}

function getKeyname( hex16bit ) {
    if( hex16bit<0x0054 ) {
        if( KEYCODES[hex16bit] ) {
            return KEYCODES[hex16bit];
        } else {
            return "KC_NO";
        }
    } else if(0xE0<=hex16bit && hex16bit<=0xE7) {
        return MODIFIERS[hex16bit-0xE0]
    } else if(hex16bit<0x0100) {
        return getKeynameFallback(hex16bit);
    }

    let action = (hex16bit>>8) & 0x0F;
    let kc = hex16bit & 0x00FF;

    switch( hex16bit>>12 ) {
        case 0:
            if(action&1) {
                return "LCTL("+getKeyname(hex16bit&(~0x0100))+")";
            } else if(action&2) {
                return "LSFT("+getKeyname(hex16bit&(~0x0200))+")";
            } else if(action&4) {
                return "LALT("+getKeyname(hex16bit&(~0x0400))+")";
            } else if(action&8) {
                return "LGUI("+getKeyname(hex16bit&(~0x0800))+")";
            } else {
                return getKeyname(kc);
            }
        case 1:
            if(action&1) {
                return "RCTL("+getKeyname(hex16bit&(~0x0100))+")";
            } else if(action&2) {
                return "RSFT("+getKeyname(hex16bit&(~0x0200))+")";
            } else if(action&4) {
                return "RALT("+getKeyname(hex16bit&(~0x0400))+")";
            } else if(action&8) {
                return "RGUI("+getKeyname(hex16bit&(~0x0800))+")";
            } else {
                return getKeyname(kc);
            }
        case 4:
            return "LT("+action.toString(10)+","+getKeyname(kc)+")";
        case 5:
            if(action==1) {
                return "MO("+kc.toString(10)+")";
            } else {
                return getKeynameFallback(hex16bit);
            }
            
        case 6:
            switch( action ){
                case 1:
                    return "LCTL_T("+getKeyname(kc)+")";
                case 2:
                    return "LSFT_T("+getKeyname(kc)+")";
                case 4:
                    return "LALT_T("+getKeyname(kc)+")";
                case 8:
                    return "LGUI_T("+getKeyname(kc)+")";
                default:
                    return getKeynameFallback(hex16bit);
            }
        case 7:
            switch( action ){
                case 1:
                    return "RCTL_T("+getKeyname(kc)+")";
                case 2:
                    return "RSFT_T("+getKeyname(kc)+")";
                case 4:
                    return "RALT_T("+getKeyname(kc)+")";
                case 8:
                    return "RGUI_T("+getKeyname(kc)+")";
                default:
                    return getKeynameFallback(hex16bit);
            }
        default:
            return getKeynameFallback(hex16bit);
    }
}