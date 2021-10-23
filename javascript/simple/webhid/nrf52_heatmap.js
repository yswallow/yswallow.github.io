const heatmap = [];

function request_heatmap() {
    for(i=0;i<nrf52_common.row_count;i++) {
        setTimeout((j) => {
            nrf52_common.sendReport(new Uint8Array([0x02,0x80,j,0]));
        }, i*250, i);
        
        if(nrf52_common.col_count>13) {
            setTimeout((j) => {
                nrf52_common.sendReport(new Uint8Array([0x02,0x80,j,1]));
            }, (nrf52_common.row_count+i)*250, i)
        }
    }
}

function print_heatmap(change_ev) {
    //request_heatmap();
    reader = new FileReader();

    reader.addEventListener("load", (ev)=>{
        data = JSON.parse(ev.target.result);
        keymap = data.layouts.keymap;
        sorted_heatmap = [];
        for(i=0;i<keymap.length;i++) {
            row = keymap[i];
            sorted_heatmap[i] = [];
            for(j=0;j<keymap[i].length;j++) {
                d = row[j].split(",").map(s=>parseInt(s));
                sorted_heatmap[i][j] = heatmap[d[0]][d[1]];
            }
        }

        document.getElementById("heatmap-area").innerHTML = 
            "<table><tr><td>"+ 
            sorted_heatmap.map(l=>l.join("</td><td>")).join("</td></tr><tr><td>") +
            "</td></tr></table>";
    })

    file = document.getElementById("kle-file").files[0];
    reader.readAsText(file);
}

function set_heatmap(row, shift, data) {
    if(heatmap[row]==undefined) {
        heatmap[row] = [];
    }

    for(i=0;i<data.length/2;i++) {
        heatmap[row][13*shift+i] = data[2*i]+(data[2*i+1]<<8);
    }
}
function parseHidResponse(event) {
    const view = new Uint8Array(event.data.buffer);
    nrf52_common.received();
    if( view[0] == 0x02 ) {
        data_ary = [];
        for(i=2;i<32;i++) {
            data_ary.push(view[i]);
        }
        console.log(data_ary.join(","));
        if( view[1]== 0x06 ) {
            nrf52_common.cntr_count = view[4];
            nrf52_common.col_count = view[3];
            nrf52_common.row_count = view[2];
        } else if(view[1]==0x80) {
            row2 = view[2]*2+view[3];
            set_heatmap(view[2], view[3], data_ary.slice(2));
            return;
        }
    }
}

window.addEventListener("load",()=>{
    document.getElementById("execute").addEventListener("click", nrf52_common.connect);
    document.getElementById("get-heatmap").addEventListener("click", request_heatmap);
    document.getElementById("kle-file").addEventListener("change", print_heatmap);
    document.getElementById("reload-heatmap").addEventListener("click", print_heatmap);
});