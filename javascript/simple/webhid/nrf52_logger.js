var display_root;

function parseHidResponse(event) {
    const view = new Uint8Array(event.data.buffer);
    console.log(view);
    if(view[0] == 0x02 && view[1]==0x8a) {
        nrf52_common.sendReport( new Uint8Array([0x02,0x89]));
    }

    if( view[0] == 0x02 && view[1] == 0x8a) {
        row = document.createElement("div");
        if(view[2]) {
            row.append("Overflow!"+view[2]);
            display_root.append(row);
            row = document.createElement("div");
        }
        data_ary = [];
        for(i=3;i<32;i++) {
            data_ary.push(view[i]);
        }
        console.log(data_ary.join(","));
        if( view[3] == 0x01 ) {
            row.append("current layer: "+view[4]+",");
            row.append("layers: ["+data_ary.slice(2,8).join(",")+"],");
            row.append("usb_report: ["+data_ary.slice(11,19).map(i=>i.toString(16)).join(",")+"],");
            row.append("ble_report: ["+data_ary.slice(20,28).map(i=>i.toString(16)).join(",")+"],");
        } else if( view[3] == 0x08 ) {
            // String
            row.append( String.fromCharCode(...(view.slice(4))) );
        }
        display_root.append(row);
        scroll2bottom();
    }
}

function scroll2bottom() {
    var element = document.documentElement;
    var bottom = element.scrollHeight - element.clientHeight;
    window.scroll(0, bottom);
}

function disableDebug() {
    nrf52_common.sendReport( new Uint8Array([0x02, 0x88, 0x00]));
}

window.addEventListener("load",()=>{
    document.getElementById("execute").addEventListener("click", nrf52_common.connect);
    document.getElementById("enable-debug").addEventListener("click", ()=>{
        nrf52_common.sendReport( new Uint8Array([0x02, 0x88, 0x01]));
    });
    document.getElementById("disable-debug").addEventListener("click", disableDebug);
    document.getElementById("disable-debug2").addEventListener("click",disableDebug);
    display_root = document.getElementById("output")
});