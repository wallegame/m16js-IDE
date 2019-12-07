function VirtualMachine() {
    
    this.mem = new Uint8Array(256*128)
    this.regs = new Uint16Array(16)

    this.decodeb64 = (value) => {
        value = value.charCodeAt(0)
        return (value >= 65 && value <= 90)?(value-65+0)
             : (value >= 97 && value <= 122)?(value-97+26)
             : (value >= 48 && value <= 57)?(value-48+52)
             : (value == 43 ? 62: 63);
    }

    this.db64 = (mask,inst) => {
        return this.decodeb64(mask[Math.floor(inst/6)]) & (1<<(5-inst%6))
    }

    this.execute = (inst,op1,op2,op3) => {
        let r1 = (op1&0xFF)>>4;
        let r2 = (op1&0xFF)&15;


        let temp;
        let src;
        let addr;
        let stat;
        let flg;
        //  BASAOXCSASLASAOXCSASLASAOXCASLASAOXCAMDMSSRRSLASAOXCAMDMSSRRSJJJJJJJJBBBBBBBBRSCCCSSSIDJJNENPPPPJJPPIDSLCCCCC
        //  RDUNROMTDBDDUNROMTDBDDUNROMDBDDUNROMDUIOHHOOBDDUNROMDUIOHHOOBENLGLGCCENLGLGCCTYLLLEEENEMSOXOSSOOMSSSNETDPPPPP
        //  KDBDWRPRCCBDBDBRPRCCBDBDBRPCC DBD RPCLVDRLLRC DBD RPCLVDRLLRCQETEETSCQETEETSCSSCZNCZNCCPRTSPHHPPPRHHCCRWSSSSS
        //   WWW WWWWW BBB BBBBBXBBBXBBBB                                                        BW     BWWB    BB  WBB  
        if("0111111111011111111101111111101111111111111110111111111111111000000000000000000000000111111011000000000011111"[inst]=='1') src = temp = this.get_reg(r1);
        if("0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000"[inst]=='1') this.set_memB((op1<<8|op2), op3);
        if("0111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000110111100"[inst]=='1') addr = (op2<<8|op3)+this.get_reg(r2);
        if("0111111011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000110000"[inst]=='1') temp = this.get_memW(addr&0xffff);
        if("0000000000111111101100000000000000000000000000000000000000000000000000000000000000000000000000000000110001000"[inst]=='1') temp = this.get_memB(addr&0xffff);
        if("0000000000000000000011111111100000000000000000000000000000000000000000000000000000000000000000000000000000100"[inst]=='1') temp = this.get_memBX(addr&0xffff);
        if("0000000000000000000000000000011111111111111110000000000000000000000000000000000000000000000000000000000000010"[inst]=='1') temp = (op2<<8|op3);
        if("0000000000000000000000000000000000000000000001111111111111111000000000000000000000000000000000000000000000001"[inst]=='1') temp = this.get_reg(r2); 
        if("0000000000000000000000000000000000000000000000000000000000000111111111111111100000000000000000001111000000000"[inst]=='1') temp = (op1<<8|op2);
        if("0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000"[inst]=='1') temp = this.popB();
        if("0000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000010000000000000"[inst]=='1') temp = this.popW();
        if("0100000010010000001001000001001000001000000000100000100000000000000000000000000000000000000000000000000000000"[inst]=='1') temp = src + temp;
        if("0010001001001000100100100010100100010000000010010001000000001000000000000000000000000000000000000000000000000"[inst]=='1') temp = src - temp;
        if("0000000010000000001000000001000000001000000000000000100000000000000000000000000000000000000000000000000000000"[inst]=='1') temp += this.get_flag(2);
        if("0000000001000000000100000000100000000000000010000000000000001000000000000000000000000000000000000000000000000"[inst]=='1') temp -= !this.get_flag(2);
        if("0000000000000000000000000000000000000100000000000000010000000000000000000000000000000000000000000000000000000"[inst]=='1') temp = src * temp;
        if("0000000000000000000000000000000000000010000000000000001000000000000000000000000000000000000000000000000000000"[inst]=='1') temp = src / temp;
        if("0000000000000000000000000000000000000001000000000000000100000000000000000000000000000000000000000000000000000"[inst]=='1') temp = src % temp;
        if("0001000000000100000000010000000010000000000000001000000000000000000000000000000000000000000000000000000000000"[inst]=='1') temp = src & temp;
        if("0000100000000010000000001000000001000000000000000100000000000000000000000000000000000000000000000000000000000"[inst]=='1') temp = src | temp;
        if("0000010000000001000000000100000000100000000000000010000000000000000000000000000000000000000000000000000000000"[inst]=='1') temp = src ^ temp;
        if("0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000"[inst]=='1') {temp = src&0x80? src|0xFF00 : src;}
        if("0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000"[inst]=='1') temp = !temp;
        if("0000000000000000000000000000000000000000100000000000000010000000000000000000000000000000000000000000000000000"[inst]=='1') temp = this.shr(src,temp);
        if("0000000000000000000000000000000000000000000100000000000000010000000000000000000000000000000000000000000000000"[inst]=='1') temp = this.ror(src,temp);
        if("0000000000000000000000000000000000000000010000000000000001000000000000000000000000000000000000000000000000000"[inst]=='1') temp = this.shl(src,temp);
        if("0000000000000000000000000000000000000000001000000000000000100000000000000000000000000000000000000000000000000"[inst]=='1') temp = this.rol(src,temp);
        if("0000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000100000000"[inst]=='1') ++temp;
        if("0000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000010000000"[inst]=='1') --temp;
        if("0000000000000000000000000000011111111111111110000000000000000000000000000000000000000000000000000000000000010"[inst]=='1') temp += this.get_reg(r2);
        if("0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000001000000000"[inst]=='1') this.pushB(temp);
        if("0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000010000000000"[inst]=='1') this.pushW(temp);
        if("0111111011011111101101111111101111111111000010111111111100001000000000000000000000000110010000000000000000000"[inst]=='1') {this.updateFlags(temp)}
        if("0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111"[inst]=='1') this.updateSignFlags(src,temp);
        if("0111110011011111001101111101101111101111111110111110111111111000000000000000000000000110010000000000000000000"[inst]=='1') temp &= 0xFFFF;
        if("0111110011111111001111111101111111101111111111111110111111111000000000000000000000000110011000110000000100000"[inst]=='1') this.set_reg(r1, temp);
        if("0000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000110000000"[inst]=='1') this.set_memB(addr&0xffff, temp);
        if("0000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"[inst]=='1') this.set_memW(addr&0xffff, temp);
        if("0000000000000000000000000000000000000000000000000000000000000000000110000001100000000000000000000000000000000"[inst]=='1') stat = this.get_flag(2); //C
        if("0000000000000000000000000000000000000000000000000000000000000110000001100000000000000000000000000000000000000"[inst]=='1') stat = this.get_flag(1); //Z
        if("0000000000000000000000000000000000000000000000000000000000000001100000011000000000000000000000000000000000000"[inst]=='1') stat = this.get_flag(0); //N
        if("0000000000000000000000000000000000000000000000000000000000000000011000000110000000000000000000000000000000000"[inst]=='1') stat = this.get_flag(0) || this.get_flag(1);
        if("0000000000000000000000000000000000000000000000000000000000000010101010101010100000000000000000000000000000000"[inst]=='1') stat = !stat;
        if("0000000000000000000000000000000000000000000000000000000000000111111110000000000000000000000000000000000000000"[inst]=='1') this.condJump(stat,temp);
        if("0000000000000000000000000000000000000000000000000000000000000000000001111111100000000000000000000000000000000"[inst]=='1') this.condJumpRel(stat,temp);
        if("0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000100000000000"[inst]=='1') this.pushW(this.regs[14]+3);
        if("0000000000000000000000000000000000000000000000000000000000000000000000000000010000000001100000001100000000000"[inst]=='1') {this.regs[14] = temp; return;}
        if("0000000000000000000000000000000000000000000000000000000000000000000000000000000111111000000000000000000000000"[inst]=='1') flg = 0;
        if("0000000000000000000000000000000000000000000000000000000000000000000000000000000000111000000000000000000000000"[inst]=='1') flg = !flg;
        if("0000000000000000000000000000000000000000000000000000000000000000000000000000000100100000000000000000000000000"[inst]=='1') this.set_flag(2,flg);
        if("0000000000000000000000000000000000000000000000000000000000000000000000000000000010010000000000000000000000000"[inst]=='1') this.set_flag(1,flg);
        if("0000000000000000000000000000000000000000000000000000000000000000000000000000000001001000000000000000000000000"[inst]=='1') this.set_flag(0,flg);
        if("0000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000"[inst]=='1') this.syscall();
        if("0111111111111111111111111111111111111111111111111111111111111000000000000000001111111110011111110011111111111"[inst]=='1') this.regs[14]++;
        if("0111111111111111111111111111111111111111111111111111111111111000000000000000000000000110011011110011111111111"[inst]=='1') this.regs[14]++;
        if("0111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000011111111110"[inst]=='1') this.regs[14]++;
        if("0111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000111111110"[inst]=='1') this.regs[14]++;
        if(inst == 0x00) this.set_flag(3,1);
    }

    this.set_memB = (ad, val) => { this.mem[ad] = val}
    this.set_memW = (ad, val) => {
        this.mem[ad] = (val&0xFF00) >> 8;
        this.mem[ad+1] = val & 0x00FF;
    }
    
    this.get_memB = (ad) => {
        return this.mem[ad]
    }
    this.get_memW = (ad) => {
        return this.mem[ad] << 8 | this.mem[ad + 1]
    }
    this.get_memBX = (ad) => {
        return this.mem[ad]&0x80 ? this.mem[ad] | 0xFF00 : this.mem[ad]
    }

    this.set_reg = (id, val) => {this.regs[id] = val}
    this.get_reg = (id) => {return this.regs[id]}

    this.get_flag = (id)  => { return (this.regs[15] & (1 << id)) != 0; }
    this.set_flag = (id, val) => {
        if(val) this.regs[15] |= (1 << id);
        else this.regs[15] &= ~(1 << id);
    }

    this.pushB = (val) => { this.mem[this.regs[13]--] = val}
    this.pushW = (val) => {
        this.mem[this.regs[13]--] = val & 0x00FF
        this.mem[this.regs[13]--] = (val&0xFF00) >> 8
    }
    this.popB = () => {
        return this.mem[++this.regs[13]]
    }
    this.popW = () => {
        return this.mem[++this.regs[13]] << 8 | this.mem[++this.regs[13]]
    }

    this.updateFlags = (val) =>{
        this.set_flag(2, val > 0xFFFF);
        this.set_flag(1, val == 0);
        this.set_flag(0, val < 0);
    }

    this.updateSignFlags = (src,temp) =>{
        val = (src>0x7FFF? 0x10000-src: src) - (temp>0x7FFF? 0x10000-temp: temp)
        this.set_flag(2, val > 0xFFFF);
        this.set_flag(1, val == 0);
        this.set_flag(0, val < 0);
    }

    this.condJumpRel = (stat, addr) => {
        if (stat) this.regs[14] += addr;
        else this.regs[14] += 3;
    }

    this.condJump = (stat, addr) => {
        if (stat) this.regs[14] = addr;
        else this.regs[14] += 3;
    }

    this.shr = (r1, n) => {return (r1 >> n)}
    this.ror = (r1, n) => {return (r1 >> n) | (r1 << (16 - n))}
    this.shl = (r1, n) => {return (r1 << n)}
    this.rol = (r1, n) => {return (r1 << n) | (r1 >> (16 - n))}

    this.syscall = () =>{
        cmd = this.get_reg(11)
        if(cmd==0x11) terminal(this.get_reg(10)&0xFFFF)
        if(cmd==0x13) terminal(String.fromCharCode(this.get_reg(10)))
        if(cmd==0x14){while(this.mem[this.regs[10]]!=0){terminal(String.fromCharCode(this.mem[this.regs[10]++]));}}
        if(cmd==0x15){
            if(this.get_flag(8)){
                --this.regs[14]
            }else{
                if(term_stdin){
                    for (var j = 0; j < term_stdin.length; j++) {
                        this.mem[this.regs[10]+j] = term_stdin.charCodeAt(j)&0xFF
                    }
                    this.mem[this.regs[10]+j] = 0
                    this.regs[10] += term_stdin.length
                    closeTermScan()
                }else{
                    termScan()
                    this.set_flag(8,1)
                    --this.regs[14]
                }
            }
        }
        if(cmd==0x21) this.set_reg(10,Math.floor(Math.random()*0xFFFF))
        if(cmd==0x32){
            let size = this.regs[10];
            for (var i = 0; i < heap.length; i++) {
                let block = heap[i]
                if(block[0]==0 && block[1]>=size){
                    let temp = heap.slice(0,i)
                    temp.push([0,block[1]-size,block[2]+size,0])
                    heap = temp.concat(heap.slice(i))
                    block[1] = size;
                    block[0] = 1;
                    this.set_reg(10,block[2])
                    return
                }
            }
            this.set_reg(10,0)
        }
        if(cmd==0x50) terminal(this.mem.slice(this.regs[10],this.regs[9]).toString()+'\n')
        if(cmd==0x70){
            let resolution = 64;
            let pxsize = 128/resolution;
            let color = this.regs[9];
            let pixel = this.regs[10];
            let r = ((color&0b1111100000000000)>>11)*8
            let g = ((color&0b0000011111100000)>>5)*4
            let b = (color&0b0000000000011111)*8
            monitor.fillStyle = "rgba("+r+","+g+","+b+",1)";
            monitor.fillRect((pixel%resolution)*pxsize,(Math.floor(pixel/resolution)%resolution)*pxsize,pxsize,pxsize);
        }
    }

    this.step = () => {
        if(!this.get_flag(3))
            this.execute(this.get_memB(this.regs[14]),this.get_memB(this.regs[14]+1),this.get_memB(this.regs[14]+2),this.get_memB(this.regs[14]+3));
        this.regs[0] = 0;
        //console.log(this.mem.slice(this.regs[13],256))
    }

    this.loadHex = (hex,start=256) => {
        for (var i = 0; i < hex.length; i+=2) {
            this.mem[Math.floor(i/2)+start] = parseInt(hex.substr(i,2),16)
        }
    }

    this.loadSections = (sects) => {
        for (start in sects) {
            hex = sects[start];
            start = parseInt(start)
            for (var j = 0; j < hex.length; j+=2) {
                this.mem[Math.floor(j/2)+start] = parseInt(hex.substr(j,2),16)
            }
        }
    }

}