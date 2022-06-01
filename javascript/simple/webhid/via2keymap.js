const keyboardConf = {
    row_count: 0,
    col_count: 0,
    layer_count: 0,
    keymap: [],
    layout: [],
}

function request_layer_count() {
    nrf52_common.sendReport( [0x11,0] );
}

function request_keymap() {
    if( keyboardConf.col_count==0 || keyboardConf.row_count==0 ) {
        document.getElementById("info-file-button").click();
        return;
    }
    let layer_size = keyboardConf.col_count * keyboardConf.row_count * 2;
    let reports_per_layer = Math.ceil( layer_size / 28 );
    for(let i=0;i<keyboardConf.layer_count;i++) {
        for(let j=0;j<reports_per_layer;j++) {
            let offset = layer_size*i+j*28;
            let size = layer_size - 28*j
            if( size>28 ) {
                size = 28;
            }

            setTimeout((offset1, offset2, size) => {
                nrf52_common.sendReport( [0x12, offset1, offset2, size] );
            }, (i*reports_per_layer+j)*100, offset>>8, offset&0x00FF, size);
        }
    }

    setTimeout(print_keymap, keyboardConf.layer_count*reports_per_layer*100+1000);
}

function load_infofile(change_ev) {
    reader = new FileReader();

    reader.addEventListener("load", (ev)=>{
        data = JSON.parse(ev.target.result);
        console.log(data);
        keyboardConf.layout = data.layouts[ Object.keys(data.layouts)[0] ].layout;
        keyboardConf.col_count = data["matrix-pins"].cols.length;
        keyboardConf.row_count = data["matrix-pins"].rows.length;
        document.getElementById("connect").removeAttribute("disabled");
    })

    file = document.getElementById("info-file-select").files[0];
    reader.readAsText(file);
}

function use_alternatives() {
    keyboardConf.col_count = parseInt( document.getElementById("col-count-input").value );
    keyboardConf.row_count = parseInt( document.getElementById("row-count-input").value );

    let layout = [];
    for(let r=0;r<keyboardConf.row_count;r++) {
        for(let c=0;c<keyboardConf.col_count;c++) {
            layout.push({"matrix": [r, c]});
        }
    }
    keyboardConf.layout = layout;

    document.getElementById("connect").removeAttribute("disabled");
}

function print_keymap() {
    let keymap = []
    let keymap_str = "";
    for(let i=0; i<keyboardConf.layer_count; i++) {
        keymap[i] = []
        for(let j=0; j<keyboardConf.row_count; j++) {
            keymap[i][j] = 0
        }
    }

    for(let l=0; l<keyboardConf.layer_count; l++) {
        for(let i=0; i<keyboardConf.layout.length; i++) {
            let row = keyboardConf.layout[i].matrix[0];
            let col = keyboardConf.layout[i].matrix[1];

            let index_base = l*keyboardConf.col_count*keyboardConf.row_count*2 + row*keyboardConf.col_count*2 + col*2;
            keymap[l][i] = keyboardConf.keymap[index_base]<<8 | keyboardConf.keymap[index_base+1];
        }
    }

    for(let l=0; l<keyboardConf.layer_count; l++) {
        keymap_str += "{";

        for(let i=0; i<keyboardConf.layout.length; i++) {
            if( i%keyboardConf.col_count==0 ) {
                keymap_str += "\r\n";
            }
            keymap_str += getKeyname(keymap[l][i]);
            keymap_str += ", ";
        }

        keymap_str += "\r\n},\r\n";
    }

    document.getElementById("keymap-area").value = keymap_str;
}

function set_keymap(offset, data) {
    for(i=0;i<data.length/2;i++) {
        keyboardConf.keymap.splice(offset, data.length, ...data);
    }
}

function parseHidResponse(event) {
    const view = new Uint8Array(event.data.buffer);
    nrf52_common.received();
    if( view[0] == 0x11 ) {
        keyboardConf.layer_count = view[1];
        console.log(view[1]);
        setTimeout(request_keymap,100);
    } else if( view[0] == 0x12) {
        let data_ary = [];
        
        let offset = view[1]<<8 | view[2];
        let size = view[3];

        for(i=4;i<size+4;i++) {
            data_ary.push(view[i]);
        }
        console.log(data_ary.join(","));

        set_keymap(offset, data_ary);
    }
}

function connectCallback() {
    setTimeout(request_layer_count, 100);
}

window.addEventListener("load", function() {
    document.getElementById("info-file-button").addEventListener("click", (ev)=>document.getElementById("info-file-select").click());
    document.getElementById("connect").addEventListener("click", Connect);
    document.getElementById("print-keymap").addEventListener("click", print_keymap);
    document.getElementById("info-file-select").addEventListener("change", load_infofile);
    document.getElementById("use-alternatives").addEventListener("click", use_alternatives);
})