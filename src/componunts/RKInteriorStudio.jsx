import React, { useState, useEffect, useRef, useCallback } from "react";

const ENV = (typeof import.meta !== "undefined" && import.meta.env) || {};
const DEFAULT_API = ENV.VITE_API_URL || "";
const DEFAULT_PUB = ENV.VITE_R2_PUBLIC_URL || "https://pub-945c958197b34f159564b00248bdf14c.r2.dev";
const EMPTY = { slots: [], rooms: [], projects: [], images: [], chatFaqs: [] };
const isVidUrl = u => /\.(mp4|webm|mov)(\?|$)/i.test(u || "") || /\/vid\//i.test(u || "");
const Pic = ({ src, className, style, alt = "", ...r }) => src ? (isVidUrl(src) ? <video src={src} className={className} style={style} autoPlay loop muted playsInline {...r} /> : <img src={src} className={className} style={style} alt={alt} {...r} />) : <span className={"pic-ph " + (className || "")} style={style} role="img" aria-label={alt} onClick={r.onClick} />;
const U = u => u ? `url(${u})` : "none";

const CSS = `
.lv{--bg:#f7f4ef;--beige:#e9e2d8;--ink:#2a231e;--mut:#6f6760;--acc:#a8842f;--line:#e3ddd3;font-family:Inter,system-ui,Arial,sans-serif;color:var(--ink);background:var(--bg);font-size:14px;line-height:1.5;overflow-x:hidden}
.lv *{box-sizing:border-box}.lv h1,.lv h2,.lv h3,.lv .serif{font-family:"Noto Serif",Georgia,serif;font-weight:400;margin:0}
.lv em{font-style:italic;color:var(--acc)}.lv button{font:inherit;cursor:pointer}.lv a{color:inherit;text-decoration:none;cursor:pointer}
.lv ul{margin:0;padding:0;list-style:none}.lv img,.lv video{display:block;max-width:100%}
.wrap{max-width:1180px;margin:0 auto;padding:0 20px}.sec{padding:56px 0}.alt{background:var(--beige)}.dark{background:var(--ink);color:#eee}
.eyebrow{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--acc);margin-bottom:8px}
.sec h2{font-size:30px;margin-bottom:6px}.sub{color:var(--mut);margin-bottom:24px}

/* Smart Hide/Show Header on Scroll */
.header-wrapper{position:fixed;top:0;left:0;right:0;z-index:90;background:var(--bg);box-shadow:0 2px 12px rgba(0,0,0,.06);transition:transform 0.3s ease, opacity 0.3s ease}
.header-wrapper.hidden{transform:translateY(-100%);opacity:0;pointer-events:none}

.ann{background:var(--ink);color:#fff;text-align:center;font-size:11px;letter-spacing:.06em;padding:8px 12px;text-transform:uppercase;position:relative;z-index:50}.ann a{text-decoration:underline}
.hd{background:var(--bg);border-bottom:1px solid var(--line)}
.hd1{display:flex;align-items:center;gap:28px;padding:12px 20px;max-width:1180px;margin:0 auto;position:relative}
.logo{font-size:22px;letter-spacing:.22em;font-weight:600;cursor:pointer}.top a{margin-right:18px;font-size:15px}.top a.on{color:var(--acc)}
.srch{flex:1;max-width:420px;margin-left:auto;display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:#efebe4;border-radius:6px;padding:9px 12px}
.srch input{border:0;background:transparent;outline:0;flex:1;font:inherit;min-width:0}
.ic{display:flex;gap:16px;align-items:center}.ic span,.ic a{cursor:pointer;position:relative;font-size:17px;display:inline-flex;align-items:center}
.hd2{display:flex;gap:22px;padding:0 20px;max-width:1180px;margin:0 auto;border-top:1px solid var(--line)}
.hd2 a{padding:11px 0;font-size:13px;border-bottom:2px solid transparent}.hd2 a.on,.hd2 a:hover{color:var(--acc);border-color:var(--acc)}
.mega{position:absolute;left:0;right:0;top:100%;background:#fff;border-bottom:1px solid var(--line);box-shadow:0 14px 30px rgba(0,0,0,.08);z-index:44}
.mega .in{max-width:1180px;margin:0 auto;padding:26px 20px;display:flex;gap:56px}.mega h4{margin:0 0 12px;font-size:14px}.mega li{margin-bottom:9px;font-size:13px;color:var(--mut)}.mega li:hover{color:var(--acc)}

/* Mobile Header Controls */
.m-left{display:none;align-items:center;gap:14px}
.ibtn{background:none;border:0;padding:4px;display:inline-flex;align-items:center;justify-content:center;color:var(--ink)}
.m-srch-bar{display:none;padding:10px 16px;background:#efebe4;border-top:1px solid var(--line);align-items:center;gap:8px}
.m-srch-bar input{flex:1;border:0;background:transparent;outline:0;font:inherit;min-width:0}

/* Mobile Full-Screen Drawer */
.mdraw{position:fixed;inset:0;background:#fff;z-index:120;display:flex;flex-direction:column;color:var(--ink);animation:fadeIn .18s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.md-hd{display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:1px solid var(--line);background:#fff;flex:none}
.md-hd .md-ttl{font-family:"Noto Serif",Georgia,serif;font-size:20px;display:flex;align-items:center;gap:12px}
.md-body{flex:1;overflow-y:auto;background:#fff}
.md-acc{background:#f5f0e8;margin-bottom:8px}
.md-acc-hd{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;font-size:15px;font-weight:500;cursor:pointer;border-bottom:1px solid rgba(0,0,0,.05)}
.md-row{display:flex;align-items:center;justify-content:space-between;padding:15px 20px;font-size:15px;color:#2a231e;cursor:pointer;border-bottom:1px solid rgba(0,0,0,.03)}
.md-row:active{background:#ebe4d8}
.md-card{background:#f7f4ef;padding:17px 18px;margin-bottom:8px;font-size:15px;font-weight:500;display:flex;align-items:center;justify-content:space-between;cursor:pointer}

/* Mobile Split Subcategory View */
.md-split{display:grid;grid-template-columns:118px 1fr;flex:1;overflow:hidden}
.md-tabs{background:#f5f0e8;overflow-y:auto;border-right:1px solid var(--line)}
.md-tab{padding:16px 12px;font-size:13px;line-height:1.35;color:var(--mut);border-bottom:1px solid rgba(0,0,0,.05);cursor:pointer;border-left:3px solid transparent}
.md-tab.on{background:#fff;color:var(--ink);font-weight:600;border-left-color:var(--acc)}
.md-list{overflow-y:auto;padding:8px 18px 24px;background:#fff}
.md-item{padding:14px 0;font-size:14.5px;color:#2a231e;border-bottom:1px solid #f2eee8;cursor:pointer;display:flex;justify-content:space-between;align-items:center}
.md-item:active{color:var(--acc)}
.md-ft{padding:12px 16px;border-top:1px solid var(--line);background:#fff;flex:none}
.md-cta{width:100%;background:var(--ink);color:#fff;border:0;padding:14px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;border-radius:3px}

.cityg{display:grid;grid-template-columns:260px 1fr;gap:34px;width:100%}.chip{border:1px solid var(--line);background:#fff;border-radius:20px;padding:6px 18px;font-size:13px}.chip.on{background:var(--ink);color:#fff}
.cbtn{border:1px solid var(--line);background:#f7f4ef;padding:9px 12px;border-radius:4px;text-align:left;font-size:13px}.cbtn:hover{border-color:var(--acc)}
.alpha span{margin-right:12px;font-size:12px;cursor:pointer}.alpha .on{color:var(--acc);font-weight:600}
.hero{position:relative;height:min(78vh,640px);overflow:hidden;background:#000;touch-action:pan-y}.slide{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity 1s;pointer-events:none}.slide.on{opacity:1}
.slide video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.slide:after{content:"";position:absolute;inset:0;background:rgba(0,0,0,.32);z-index:1}.hc{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:0 20px 70px;color:#fff;text-align:center}
.hc h1{font-size:clamp(28px,5vw,54px);line-height:1.15;color:#fff}.hc h1 em{color:#fff}.btnw{margin-top:22px;background:#fff;color:var(--ink);border:0;padding:12px 26px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:500}
.dots{position:absolute;bottom:22px;left:0;right:0;display:flex;justify-content:center;gap:8px;z-index:4}.dots i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.5);cursor:pointer}.dots i.on{background:#fff;width:24px;border-radius:5px}
.arr{position:absolute;top:50%;transform:translateY(-50%);z-index:4;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.85);display:grid;place-items:center;font-size:18px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.card{background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.05)}.card img{width:100%;height:190px;object-fit:cover;transition:transform .5s}.card:hover img{transform:scale(1.04)}.card .b{padding:18px}.card h3{font-size:19px;margin-bottom:6px}.card p{color:var(--mut);margin:0 0 12px}
.ln{text-decoration:underline;font-size:13px;cursor:pointer}.craft{height:210px;border-radius:6px;position:relative;overflow:hidden;color:#fff;display:flex;align-items:flex-end;padding:14px;font-size:13px}
.tech{background:var(--ink);color:#eee;border-radius:8px;padding:34px 0 0;text-align:center}.tech h2{font-size:28px}.tech .cols{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #4a423c;margin-top:28px}.tech .cols div{padding:28px;border-right:1px solid #4a423c;font-size:13px}.tech .cols h3{font-size:19px;margin:10px 0 8px}
.jr{display:grid;grid-template-columns:320px 1fr;gap:40px}.step{display:flex;gap:12px;align-items:flex-start;background:#fff;border-left:3px solid transparent;padding:16px;margin-bottom:12px;cursor:pointer;border-radius:3px}.step.on{border-color:var(--acc)}.step b{background:var(--acc);color:#fff;border-radius:50%;width:26px;height:26px;display:grid;place-items:center;font-size:12px;flex:none}
.ms{background:#e1f2e5;color:#3f7d4f;font-size:9px;letter-spacing:.08em;padding:2px 7px;border-radius:3px;margin-left:8px}.tl li{position:relative;padding:0 0 16px 22px;border-left:1px solid var(--line);margin-left:6px}.tl li:before{content:"";position:absolute;left:-5px;top:5px;width:9px;height:9px;border-radius:50%;background:var(--ink)}.tl p{margin:2px 0 0;color:var(--mut);font-size:13px}
.exp{background:#fff;border-radius:6px;padding:26px}.exp li{margin:8px 0;padding-left:16px;position:relative}.exp li:before{content:"";position:absolute;left:0;top:9px;width:6px;height:6px;border-radius:50%;background:var(--ink)}
.tst img{width:100%;height:210px;object-fit:cover;cursor:pointer}.tst{background:#fff;text-align:center;border-radius:4px;overflow:hidden}.tst blockquote{margin:0;padding:22px;font-family:"Noto Serif",Georgia,serif;font-style:italic;font-size:16px}.tst small{display:block;padding:0 0 22px;color:var(--mut)}.tst small b{display:block;font-size:10px;letter-spacing:.1em;color:var(--ink)}
.faq{display:grid;grid-template-columns:1fr 2fr;gap:40px}.fq{border-bottom:1px solid var(--line);padding:14px 0;cursor:pointer}.fq div{display:flex;justify-content:space-between;gap:12px;font-size:15px}.fq:hover>div{color:var(--acc)}.fq p{margin:8px 0 0;color:var(--mut)}

/* Responsive Lead Form */
.leadw{display:grid;grid-template-columns:1fr 440px;gap:50px;align-items:center}.lead h2{font-size:32px}
.form{background:var(--bg);color:var(--ink);padding:26px;border-radius:8px;width:100%;max-width:100%}
.form h3{font-size:24px;margin-bottom:14px;line-height:1.25;padding-right:28px}
.form label{display:block;font-size:10px;letter-spacing:.1em;text-transform:uppercase;margin:12px 0 5px;color:#555}
.form input,.form select{width:100%;padding:11px 12px;border:1px solid var(--line);background:#efebe4;border-radius:4px;font:inherit;max-width:100%;min-width:0}
.ph{display:flex;gap:0;width:100%}
.ph select{width:92px;border-right:0;border-radius:4px 0 0 4px;flex:none;padding:11px 6px}
.ph input{border-radius:0 4px 4px 0;flex:1;min-width:0}
.sub1{width:100%;margin-top:18px;background:var(--ink);color:#fff;border:0;padding:14px;letter-spacing:.08em;font-size:12px;text-transform:uppercase;border-radius:4px}
.err{color:#c0392b;font-size:11px;margin-top:3px}.ok{background:#e1f2e5;color:#2d6a3e;padding:16px;border-radius:4px}

.stat{display:flex;gap:14px;align-items:center;background:#fff;padding:18px;border-radius:6px}.stat i{width:40px;height:40px;border-radius:50%;background:#f3e4dd;display:grid;place-items:center;font-style:normal;flex:none}.stat b{font:400 22px "Noto Serif",Georgia,serif;display:block}.stat span{font-size:10px;letter-spacing:.1em;color:var(--mut)}
.est{background:#fff;color:var(--ink);padding:18px;border-radius:6px;display:flex;gap:14px}.est h3{font-size:19px}.est p{color:var(--mut);margin:4px 0 12px}.est button,.out{border:1px solid var(--line);background:#fff;font-size:10px;letter-spacing:.1em;padding:7px 14px;text-transform:uppercase}.est button:hover{background:var(--ink);color:#fff}
.dcard{position:relative;height:300px;border-radius:6px;overflow:hidden;cursor:pointer;color:#fff;background-size:cover;background-position:center top}.dcard:after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 45%,rgba(0,0,0,.72))}.dcard div{position:absolute;left:14px;bottom:14px;right:14px;z-index:2;display:flex;justify-content:space-between;align-items:flex-end}.dcard h3{font-size:17px;color:#fff}.circ{width:32px;height:32px;border-radius:50%;background:#fff;color:var(--ink);display:grid;place-items:center;flex:none}
.gal{display:grid;grid-template-columns:1.2fr 2fr 1.4fr;gap:14px;height:280px}.gal div{background-size:cover;background-position:center;border-radius:4px;position:relative;cursor:pointer}.gal span{position:absolute;left:0;top:0;background:#fff;font-size:9px;letter-spacing:.08em;padding:3px 8px;text-transform:uppercase}
.nav2{display:flex;justify-content:space-between;align-items:center;margin-top:14px}.nav2 button{width:42px;height:42px;border-radius:50%;border:1px solid var(--line);background:#fff;margin-left:8px}
.tabs{display:flex;gap:26px;overflow:auto;border-bottom:1px solid var(--line);margin-bottom:26px;-webkit-overflow-scrolling:touch}.tabs a{padding:12px 0;white-space:nowrap;border-bottom:2px solid transparent;color:var(--mut)}.tabs a.on{color:var(--acc);border-color:var(--acc)}
.dg{display:grid;grid-template-columns:repeat(4,1fr);gap:22px}.di{position:relative;cursor:pointer}.di img,.di video{width:100%;height:230px;object-fit:cover;object-position:top;border-radius:4px}.di p{margin:8px 0 0;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.promo{background:var(--ink);color:#fff;padding:24px;border-radius:4px;min-height:230px}.promo.t{background:var(--acc);text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:12px}.promo h3{font-size:22px;color:#fff}
.tag{background:#625b55;color:#fff;font-size:10px;letter-spacing:.06em;padding:8px 12px;display:inline-block;margin:0 8px 8px 0;text-transform:uppercase;cursor:pointer}.tag:hover{background:var(--acc)}
.reel{width:210px;flex:none;border-radius:6px;overflow:hidden;cursor:pointer}.reel img,.reel video{width:100%;height:310px;object-fit:cover}.row{display:flex;gap:16px;overflow:auto;scroll-behavior:smooth;-webkit-overflow-scrolling:touch}
.sticky{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:45;background:#fff;padding:8px;display:flex;gap:8px;box-shadow:0 6px 24px rgba(0,0,0,.2);border-radius:4px}.sticky button,.btn2{border:1px solid var(--ink);background:#fff;padding:10px 16px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;display:inline-block}.sticky .d,.btn2.d{background:var(--ink);color:#fff}
.seo li{padding:14px 0;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;cursor:pointer}.seo li:hover{color:var(--acc)}.seo p{margin:0;color:var(--mut)}
.mag{display:grid;grid-template-columns:2fr 1fr;gap:34px}.mag .ed{display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:4px;height:340px}.mag .ed div{background-size:cover;background-position:center}.rs{display:flex;gap:12px;margin-bottom:16px;cursor:pointer}.rs img{width:110px;height:76px;object-fit:cover;border-radius:3px}.rs small{font-size:9px;letter-spacing:.1em;color:var(--acc)}
.ch{position:relative;min-height:520px;display:flex;align-items:center;background-size:cover;background-position:center;color:#fff}.ch:before{content:"";position:absolute;inset:0;background:rgba(30,25,22,.55)}.ch .wrap{position:relative;display:grid;grid-template-columns:1fr 420px;gap:40px;align-items:center;width:100%}.ch h1{font-size:54px;line-height:1.1}
.foot{background:var(--ink);color:#ddd;padding:44px 0 24px}.foot .gr{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1.3fr;gap:20px}.foot h5{margin:0 0 12px;color:var(--acc);font-size:10px;letter-spacing:.14em}.foot li{margin-bottom:8px;font-size:13px;cursor:pointer}.foot li:hover{color:#fff}

/* Responsive Scrollable Modal Overlay */
.mod{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:130;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;-webkit-overflow-scrolling:touch}
.mbox{background:#fff;border-radius:10px;max-width:480px;width:100%;position:relative;margin:auto;max-height:92vh;overflow-y:auto;box-shadow:0 16px 48px rgba(0,0,0,.35)}
.mbox.w{max-width:860px}
.x{position:sticky;float:right;top:10px;right:10px;margin:10px 10px -42px 0;width:32px;height:32px;border-radius:50%;border:0;background:#fff;z-index:5;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,.22);display:grid;place-items:center}

.offer img,.offer video{width:100%;height:150px;object-fit:cover}.offer .p{padding:16px;text-align:left}.offer input{width:100%;padding:12px;margin-bottom:10px;border:1px solid #bbb;border-radius:4px}.offer button{width:100%;background:#e00;color:#fff;border:0;padding:12px;font-weight:600;border-radius:3px}
.fl{position:fixed;right:0;z-index:60}.wa{top:46%;background:#fff;padding:8px 8px 8px 10px;border-radius:8px 0 0 8px;box-shadow:0 2px 12px rgba(0,0,0,.2);display:grid;place-items:center}.cb{bottom:22px;right:14px;width:46px;height:46px;border-radius:50%;background:#b0614c;border:0;color:#fff;font-size:20px;box-shadow:0 4px 14px rgba(0,0,0,.3)}

/* Conversational Live Chat Drawer */
.chat{position:fixed;right:14px;bottom:78px;width:335px;max-width:calc(100vw - 28px);background:#fff;border-radius:10px;box-shadow:0 10px 36px rgba(0,0,0,.28);z-index:70;overflow:hidden;border:1px solid var(--line)}
.chat header{background:var(--ink);color:#fff;padding:11px 14px;display:flex;justify-content:space-between;align-items:center;gap:8px}
.chat .ms2{height:255px;overflow-y:auto;padding:12px;background:#f7f4ef;display:flex;flex-direction:column}
.chat .m{max-width:85%;padding:8px 11px;border-radius:10px;margin-bottom:8px;font-size:13px;background:#fff;line-height:1.4;box-shadow:0 1px 3px rgba(0,0,0,.05)}
.chat .u{background:var(--acc);color:#fff;margin-left:auto}
.chat .adm{background:#2a231e;color:#fff;border-left:3px solid var(--acc)}
.chat .adm small{display:block;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#e0c379;margin-bottom:2px}
.chat-qs{padding:8px 10px;background:#efeae1;border-top:1px solid var(--line);display:flex;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch}
.chat-q{flex:none;background:#fff;border:1px solid #d6cdc0;border-radius:14px;padding:4px 10px;font-size:11.5px;color:var(--ink);white-space:nowrap}
.chat-q:hover{border-color:var(--acc);color:var(--acc)}
.chat form{display:flex;border-top:1px solid var(--line);background:#fff}.chat input{flex:1;border:0;padding:11px 12px;outline:0;min-width:0}

.calc label{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin:14px 0 6px;color:#666}.calc select,.calc input{width:100%;padding:10px;border:1px solid var(--line);border-radius:4px}.res{background:var(--ink);color:#fff;padding:18px;border-radius:6px;margin-top:18px;text-align:center}.res b{font:400 28px "Noto Serif",Georgia,serif}

.brand{display:flex;align-items:center;gap:10px;cursor:pointer}.brand img,.brand .pic-ph{width:42px;height:42px;border-radius:50%;object-fit:cover;flex:none}.hd1 .logo{font-size:17px;letter-spacing:.16em;white-space:nowrap}
.g5{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}.c5{grid-template-columns:repeat(5,1fr)!important}
.abt{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}.abt>img,.abt>.pic-ph{width:100%;border-radius:6px;object-fit:cover;max-height:520px;min-height:300px}
.collage{display:grid;grid-template-columns:1fr 1fr;gap:10px}.collage img,.collage .pic-ph{width:100%;height:200px;object-fit:cover;border-radius:6px}.collage>:first-child{grid-column:1/3}
.pmini{display:flex;gap:10px;align-items:center;cursor:pointer;width:260px}.pmini img,.pmini .pic-ph{width:72px;height:54px;object-fit:cover;border-radius:4px;flex:none;min-height:0}.pmini small{display:block;color:#888}
.soc{width:34px;height:34px;border:1px solid #5a514b;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:#ddd}
.pic-ph{display:block;background:linear-gradient(135deg,#e6dfd3,#cdc3b3);min-height:100px}.card .pic-ph{height:190px}.tst .pic-ph{height:210px}.di .pic-ph{height:230px;border-radius:4px}.reel .pic-ph{height:190px}.lp img,.lp .pic-ph{height:260px}.offer .pic-ph{height:150px}
.slide,.dcard{background-color:#8b7f70}.lv .tst img{cursor:pointer}

@media(max-width:980px){
  .top,.srch,.hd2,.mega,.sticky{display:none!important}
  .m-left{display:flex}
  .m-srch-bar.on{display:flex}
  .hd1{justify-content:space-between;padding:11px 14px;gap:8px}
  .brand{position:absolute;left:50%;transform:translateX(-50%);gap:7px}
  .brand img,.brand .pic-ph{width:30px;height:30px}
  .hd1 .logo{font-size:13.5px;letter-spacing:.12em}
  .ic{margin-left:0;gap:12px}
  .g3,.g4,.g5,.dg,.foot .gr,.tech .cols,.c5{grid-template-columns:1fr 1fr!important}
  .jr,.faq,.leadw,.mag,.ch .wrap,.cityg,.abt,.gal{grid-template-columns:1fr}
  .sec{padding:40px 0}
  .sec h2{font-size:26px}
  .hero{height:min(72vh,540px)}
  .arr{width:34px;height:34px}
}
@media(max-width:520px){
  .g3,.g4,.g5,.dg,.foot .gr,.tech .cols,.c5{grid-template-columns:1fr!important}
  .brand img,.brand .pic-ph{display:none}
  .hd1 .logo{font-size:13px;letter-spacing:.14em}
  .m-left{gap:10px}
  .ic{gap:10px}
  .ch h1{font-size:34px}
  .hc{padding-bottom:58px}
  .mod{padding:10px;align-items:flex-start}
  .mbox{max-height:94vh;border-radius:8px}
  .form{padding:20px 16px}
  .form h3{font-size:21px}
  .form input,.form select{padding:10px;font-size:14px}
  .ph select{width:84px;padding:10px 4px}
  .abt>img,.abt>.pic-ph{min-height:220px}
}
`;

const B = { name: "RK Interior Studio", phones: ["+91 9705096205", "+91 7396397824"], email: "rkinteriorstudio17@gmail.com", insta: "https://www.instagram.com/rkinterior34/", address: "Telangana & Andhra Pradesh", branches: "Telangana | Andhra Pradesh" };
const tel = p => "tel:" + p.replace(/\s/g, ""); const WA = "https://wa.me/919705096205?text=";
const RATES = { fullHome: { 1: 3.2e5, 2: 5.6e5, 3: 8.4e5, 4: 12e5 }, kitchen: [60000, 85000, 105000], wardrobePerFt: 9500, pkg: [1, 1.4, 1.9] };

const SLIDES = [["Refined, functional and ", "timeless spaces", "Book Free Consultation", "h1"], ["Bespoke interiors, ", "no templates", "Book Free Consultation", "h2"], ["Concept to completion, ", "stress-free", "Explore Projects", "h3"], ["Elevate your space ", "with us", "Book Free Consultation", "h4"]];
const SERVICES = [["Space Planning & Layout Optimization", "b_svc1"], ["Color and material consultation", "b_svc2"], ["Modular Kitchen design & execution", "b_svc3"], ["Styled Interiors & Furnishings", "b_svc4"], ["Turnkey Project Execution", "b_svc5"]];
const ABOUT = ["RK interiors is a design-led interior firm dedicated to creating refined, functional, and timeless spaces.", "Our work is defined by attention to detail, thoughtful spatial planning, and a deep understanding of materials and finishes. Every project is approached with a fresh perspective, ensuring a unique and tailored design experience for each client."];
const VISION = ["Our vision is to be a trusted design studio known for delivering innovative and timeless interiors with flawless site execution. We aim to create spaces that are not only visually appealing but also highly functional and personalized.", "Every project we take on is a balance of creativity, practicality, and attention to detail. From concept to completion, we ensure smooth coordination between design and on-site execution.", "Our goal is to provide clients with a stress-free experience and interiors. By blending design excellence with skilled execution."];
const MISSION = ["Our mission is to deliver well-crafted interior spaces that seamlessly blend creativity, functionality, and quality. We are committed to understand our client’s needs and bringing their vision to life through thoughtful and intentional design.", "From planning to execution, we ensure every detail is handled with precision and care. By offering both design and complete site work, we provide end-to-end solutions that simplify the process.", "We aim to create spaces that inspire, comfort, and support the way people live and work. Our focus is on delivering excellence, on time and within budget."];
const WHY = [["Bespoke Interiors", "Each project is uniquely designed to match your style, needs, and lifestyle—no templates, only tailored solutions."], ["Precision in Every Detail", "From finishes to fittings, every element is crafted with care to ensure functionality, beauty, and long-lasting quality."], ["Seamless Project Execution", "We manage everything—from concept to completion—ensuring smooth coordination, on-time delivery, and consistent quality on site."], ["Expert Team", "Our experienced designers and execution professionals bring creativity, precision, and a deep understanding of space to every project."], ["Client-Centric Approach", "We believe in open communication, transparency, and collaboration, making your experience stress-free and rewarding."]];
const STEPS = [["Understand", "We are committed to understand our client’s needs and bring their vision to life through thoughtful and intentional design.", ["Consultation on your style, needs and lifestyle", "Bespoke concept — no templates"]], ["Plan", "Thoughtful spatial planning and a deep understanding of materials and finishes.", ["Space Planning & Layout Optimization", "Color and material consultation"]], ["Execute", "By offering both design and complete site work, we provide end-to-end solutions that simplify the process.", ["Modular Kitchen design & execution", "Turnkey Project Execution", "Precision on site, every detail handled with care"]], ["Deliver", "Excellence, on time and within budget — interiors that inspire, comfort, and support the way you live.", ["Styled Interiors & Furnishings", "Stress-free handover"]]];
const LATEST = [["b_lv", "Living Room", "This living space pairs a grey sofa and brown rug with a modern coffee table, while a grooved wood-textured wall panel adds warmth behind. Curtains bring in light and elegance, completing the balanced, contemporary design."], ["b_bd", "Bedroom", "A serene retreat with clean lines, soft neutrals, and warm lighting. Featuring a low-profile bed, textured walls, and natural accents for comfort and style. Perfectly balanced for rest and relaxation."], ["b_kt", "Kitchen", "Combining elegance with modern design, this glossy beige and cream acrylic kitchen offers a perfect balance of warmth and functionality."], ["b_tv", "TV Unit", "A striking black-and-white TV unit, defined by its modern curves and refined balance of contrast and elegance."]];
const REVIEWS = [["Delivered on Time, With Quality", "We were impressed with how smoothly everything went. From planning to execution, KS Interiors handled it all responsibly and delivered our dream kitchen on time.", "Anusha", "Dilshuknagar", "b_r3"], ["A Personalized Touch", "They designed every corner of our home based on our lifestyle. It felt truly customized — not just designed, but designed for us.", "Praveen Goud", "Medchal", "b_r2"], ["Professional & Creative Team", "The team was highly professional and always available for questions. Their ideas were fresh, and the execution was flawless. We couldn’t be happier!", "Vijaya", "Narayanaguda", "b_r4"]];
const FAQS = [["What services does RK Interior Studio offer?", "Space Planning & Layout Optimization, Color and material consultation, Modular Kitchen design & execution, Styled Interiors & Furnishings, and Turnkey Project Execution."], ["Do you handle both design and site work?", "Yes. By offering both design and complete site work, we provide end-to-end solutions that simplify the process."], ["Are your designs ready-made templates?", "No. Each project is uniquely designed to match your style, needs, and lifestyle—no templates, only tailored solutions."], ["Where do you serve?", "We serve residential and commercial projects across all of Telangana & Andhra Pradesh."], ["How do I get started?", "Call +91 9705096205 or +91 7396397824, email rkinteriorstudio17@gmail.com, or fill in the consultation form on this page."]];

const DEFAULT_INTRO = [{ id: "w1", sender: "bot", message: "Hi! 👋 Welcome to RK Interior Studio. Before we begin, what is your name?" }];

const Em = ({ t }) => { const p = t.split("|"); return <>{p[0]}<em>{p[1]}</em>{p[2] || ""}</>; };

const Ico = {
  menu: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 6h18M3 12h18M3 18h18" /></svg>,
  search: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
  phone: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9z" /></svg>,
  user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" /></svg>,
  close: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M18 6 6 18M6 6l12 12" /></svg>,
  back: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
  chev: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m9 18 6-6-6-6" /></svg>,
  wa: <svg width="26" height="26" viewBox="0 0 32 32" fill="#25D366"><path d="M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.5 1.7 6.5L3 29l6.7-1.7c1.9 1 4.1 1.6 6.3 1.6 7.2 0 13-5.8 13-13S23.2 3 16 3zm7.5 18.3c-.3.9-1.8 1.7-2.5 1.8-.7.1-1.5.2-2.4-.1-.6-.2-1.3-.4-2.2-.9-3.9-1.7-6.4-5.6-6.6-5.9-.2-.3-1.6-2.1-1.6-4s1-2.8 1.4-3.2c.4-.4.8-.5 1.1-.5h.8c.3 0 .6-.1.9.7.3.8 1.1 2.7 1.2 2.9.1.2.2.4 0 .7-.1.3-.2.4-.4.7-.2.2-.4.5-.6.7-.2.2-.4.4-.2.8.2.4 1 1.6 2.1 2.6 1.5 1.3 2.7 1.7 3.1 1.9.4.2.6.2.8-.1.2-.3 1-1.1 1.2-1.5.3-.4.5-.3.9-.2.4.1 2.3 1.1 2.7 1.3.4.2.7.3.8.5.1.2.1 1-.2 1.9z" /></svg>
};

function LeadForm({ title, cta, api, onLeadSaved }) {
  const [v, setV] = useState({ name: "", email: "", phone: "", wa: true, loc: "", svc: "" });
  const [e, setE] = useState({}); const [done, setDone] = useState(false); const [submitting, setSubmitting] = useState(false);
  const set = (k, x) => setV({ ...v, [k]: x });
  const go = async () => {
    const er = {};
    if (v.name.trim().length < 2) er.name = "Enter your name";
    if (!/^\S+@\S+\.\S+$/.test(v.email)) er.email = "Enter a valid email";
    if (!/^[6-9]\d{9}$/.test(v.phone)) er.phone = "Enter a valid 10-digit mobile number";
    if (!v.loc) er.loc = "Select a location";
    setE(er);
    if (!Object.keys(er).length) {
      setSubmitting(true);
      await fetch(`${api}/api/leads`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) }).catch(() => {});
      if (onLeadSaved) await onLeadSaved(v.name.trim(), v.phone, v.svc ? `Form enquiry (${v.loc} - ${v.svc})` : `Form enquiry (${v.loc})`);
      setSubmitting(false);
      setDone(true);
    }
  };
  if (done) return <div className="form"><div className="ok"><b>Thank you, {v.name}!</b><br />{B.name} will contact you shortly on {v.phone}.</div><a className="sub1" style={{ display: "block", textAlign: "center" }} href={WA + encodeURIComponent(`Hi ${B.name}, I'm ${v.name} (${v.phone}) from ${v.loc}. I'd like a consultation${v.svc ? " for " + v.svc : ""}.`)} target="_blank" rel="noreferrer">Continue on WhatsApp</a></div>;
  return (
    <div className="form">
      <h3 className="serif"><Em t={title} /></h3>
      <label>Name*</label><input value={v.name} onChange={x => set("name", x.target.value)} placeholder="Enter your name" /><div className="err">{e.name}</div>
      <label>Email*</label><input value={v.email} onChange={x => set("email", x.target.value)} placeholder="Enter email address" /><div className="err">{e.email}</div>
      <label>Phone number*</label><div className="ph"><select><option>🇮🇳 +91</option><option>🇦🇪 +971</option><option>🇺🇸 +1</option></select><input value={v.phone} maxLength={10} onChange={x => set("phone", x.target.value.replace(/\D/g, ""))} placeholder="Enter phone number" /></div><div className="err">{e.phone}</div>
      <label style={{ textTransform: "none", letterSpacing: 0, fontSize: 13 }}><input type="checkbox" style={{ width: "auto", marginRight: 8 }} checked={v.wa} onChange={x => set("wa", x.target.checked)} />Send me updates on WhatsApp</label>
      <label>Location*</label><select value={v.loc} onChange={x => set("loc", x.target.value)}><option value="">Select location</option><option>Hyderabad</option><option>Visakhapatnam</option><option>Vijayawada</option><option>Ananthapur</option><option>Tirupati</option><option>Warangal</option><option>Other (TS & AP)</option></select><div className="err">{e.loc}</div>
      <label>Interested in</label><select value={v.svc} onChange={x => set("svc", x.target.value)}><option value="">Select a service</option>{SERVICES.map(s => <option key={s[0]}>{s[0]}</option>)}</select>
      <button className="sub1" onClick={go} disabled={submitting}>{submitting ? "Sending..." : cta}</button>
      <p style={{ fontSize: 11, color: "#777", marginBottom: 0 }}>By submitting this form, you agree to the <u>privacy</u> policy & <u>terms and conditions</u></p>
    </div>
  );
}

function Calculator({ type, onClose }) {
  const [t, setT] = useState(type); const [bhk, setBhk] = useState(2); const [pk, setPk] = useState(1);
  const [lay, setLay] = useState(1); const [sz, setSz] = useState(10); const [ft, setFt] = useState(6);
  const m = RATES.pkg[pk];
  const val = t === "Full Home" ? RATES.fullHome[bhk] * m : t === "Kitchen" ? RATES.kitchen[lay] * (sz / 10) * m : ft * RATES.wardrobePerFt * m;
  const fmt = n => "₹" + (Math.round(n / 1000) * 1000).toLocaleString("en-IN");
  return (
    <div className="mbox calc" style={{ padding: 24 }} onClick={e => e.stopPropagation()}>
      <button className="x" onClick={onClose}>✕</button>
      <h3 className="serif" style={{ fontSize: 24, paddingRight: 30 }}><em>{t}</em> price estimator</h3>
      <label>Type</label><select value={t} onChange={e => setT(e.target.value)}><option>Full Home</option><option>Kitchen</option><option>Wardrobe</option></select>
      {t === "Full Home" && <><label>Home size</label><select value={bhk} onChange={e => setBhk(+e.target.value)}>{[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} BHK</option>)}</select></>}
      {t === "Kitchen" && <><label>Layout</label><select value={lay} onChange={e => setLay(+e.target.value)}><option value={0}>Straight</option><option value={1}>L-shaped</option><option value={2}>U-shaped</option></select><label>Counter length: {sz} ft</label><input type="range" min={6} max={24} value={sz} onChange={e => setSz(+e.target.value)} /></>}
      {t === "Wardrobe" && <><label>Width: {ft} ft</label><input type="range" min={3} max={16} value={ft} onChange={e => setFt(+e.target.value)} /></>}
      <label>Package</label><select value={pk} onChange={e => setPk(+e.target.value)}><option value={0}>Essential</option><option value={1}>Premium</option><option value={2}>Luxury</option></select>
      <div className="res">Indicative estimate<br /><b>{fmt(val)}</b><div style={{ fontSize: 11, opacity: .7 }}>*Sample rates — final quote after consultation</div></div>
      <a className="sub1" style={{ display: "block", textAlign: "center" }} href={WA + encodeURIComponent(`Hi ${B.name}, I used the estimator (${t}, ${fmt(val)}). Please share a detailed quote.`)} target="_blank" rel="noreferrer">Get exact quote on WhatsApp</a>
    </div>
  );
}

export default function RKInteriorStudio({ initialPage = "home", apiUrl = DEFAULT_API, pubUrl = DEFAULT_PUB, initialData = null }) {
  const API = apiUrl.replace(/\/$/, "");
  const PUB = pubUrl.replace(/\/$/, "");
  const [db, setDb] = useState(initialData); const [err, setErr] = useState(false);
  const [page, setPage] = useState(initialPage); const [menu, setMenu] = useState(null);
  const [slide, setSlide] = useState(0); const [hov, setHov] = useState(false); const [ann, setAnn] = useState(0);
  const [step, setStep] = useState(0); const [faq, setFaq] = useState(0);
  const [modal, setModal] = useState(null); const [chat, setChat] = useState(false);
  const [roomF, setRoomF] = useState("All"); const [projF, setProjF] = useState("All"); const [vis, setVis] = useState(12);
  const [stick, setStick] = useState(false); const [q, setQ] = useState(""); const offered = useRef(false);

  /* Smart Hide/Show Header on Scroll state */
  const [showHd, setShowHd] = useState(true);
  const lastScrollY = useRef(0);

  /* Touch swipe state for Hero */
  const touchStartX = useRef(0);

  /* Conversational Chat State */
  const [chatUser, setChatUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rk_chat_user") || "null"); } catch { return null; }
  });
  const [pendingName, setPendingName] = useState("");
  const [introMsgs, setIntroMsgs] = useState(DEFAULT_INTRO);
  const [msgs, setMsgs] = useState([]);
  const [ci, setCi] = useState("");
  const chatBodyRef = useRef(null);

  /* Mobile Navigation States */
  const [mOpen, setMOpen] = useState(false);
  const [mAccOpen, setMAccOpen] = useState(true);
  const [mSub, setMSub] = useState(null);
  const [mTab, setMTab] = useState(0);
  const [mSearchOpen, setMSearchOpen] = useState(false);

  /* Browser history popstate & modal history sync */
  useEffect(() => {
    const handlePopState = (e) => {
      if (modal) {
        setModal(null);
        return;
      }
      if (e.state) {
        setPage(e.state.page || "home");
        setRoomF(e.state.roomF || "All");
        setProjF(e.state.projF || "All");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [modal]);

  useEffect(() => {
    if (initialData) return;
    fetch(`${API}/api/data?t=${Date.now()}`, { cache: "no-store" })
      .then(r => { if (!r.ok) throw 0; return r.json(); })
      .then(setDb)
      .catch(() => setErr(true));
  }, [API, initialData]);

  useEffect(() => {
    document.body.style.overflow = mOpen || modal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mOpen, modal]);

  useEffect(() => {
    if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [msgs, introMsgs, chat, chatUser]);

  /* Scroll Hide/Show Header Logic */
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 120) {
        setShowHd(false);
      } else {
        setShowHd(true);
      }
      lastScrollY.current = currentScrollY;
      setStick(currentScrollY > 500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchChatMessages = useCallback(async (sid) => {
    if (!sid) return;
    const r = await fetch(`${API}/api/chat/messages?sessionId=${encodeURIComponent(sid)}&t=${Date.now()}`, { cache: "no-store" });
    if (r.ok) {
      const data = await r.json();
      setMsgs(data.messages || []);
    }
  }, [API]);

  const connectChatSession = useCallback(async (name, phone, initialNote = null) => {
    const digits = String(phone || "").replace(/\D/g, "").slice(-10);
    if (name.trim().length < 2 || !/^[6-9]\d{9}$/.test(digits)) return null;

    const reuseSid = chatUser && chatUser.phone === digits ? chatUser.sessionId : null;
    const sid = reuseSid || ("chat_" + Math.random().toString(36).slice(2, 10));
    const welcomeText = `Thanks ${name.trim()}! You're connected with our studio. Tap a quick question below or type any question about your home interiors.`;

    try {
      const res = await fetch(`${API}/api/chat/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, name: name.trim(), phone: digits }),
      });
      const data = await res.json();
      const info = { sessionId: data.sessionId || sid, name: name.trim(), phone: digits };
      try { localStorage.setItem("rk_chat_user", JSON.stringify(info)); } catch {}
      setChatUser(info);
      setPendingName("");
      setIntroMsgs(DEFAULT_INTRO);

      if (!reuseSid) {
        await fetch(`${API}/api/chat/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: info.sessionId,
            message: initialNote || `Name: ${name.trim()} | Phone: ${digits}`,
            botReply: welcomeText,
          }),
        });
      }
      await fetchChatMessages(info.sessionId);
      return info;
    } catch {
      return null;
    }
  }, [API, chatUser, fetchChatMessages]);

  const resetChat = () => {
    try { localStorage.removeItem("rk_chat_user"); } catch {}
    setChatUser(null);
    setPendingName("");
    setMsgs([]);
    setIntroMsgs(DEFAULT_INTRO);
    setCi("");
  };

  useEffect(() => {
    if (!chat || !chatUser?.sessionId) return;
    const sid = chatUser.sessionId;
    fetchChatMessages(sid);

    let ws;
    try {
      const base = API ? new URL(API, window.location.origin) : new URL(window.location.origin);
      const proto = base.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${proto}//${base.host}/api/ws`);
      ws.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload.sessionId === sid) fetchChatMessages(sid);
        } catch {}
      };
    } catch {}

    const poll = setInterval(() => fetchChatMessages(sid), 3500);
    return () => {
      clearInterval(poll);
      if (ws) try { ws.close(); } catch {}
    };
  }, [chat, chatUser, API, fetchChatMessages]);

  const D = db || EMPTY;
  const resolveUrl = u => !u ? "" : /^(https?:\/\/|\/)/i.test(u) ? u : `${PUB}/${u.replace(/^\//, "")}`;
  const G = D.images.filter(i => !i.slot).map(i => [i.project, i.room, i.id]);
  const ROOMS = D.rooms.map(r => r.name);
  const RM = Object.entries(D.rooms.reduce((a, r) => ((a[r.group || "Other"] = a[r.group || "Other"] || []).push(r.name), a), {}));
  const PROJ = D.projects.map(p => [p.id, p.name, (G.find(g => g[0] === p.id) || [])[2]]);
  const PN = Object.fromEntries(PROJ.map(p => [p[0], p[1]]));
  const byId = Object.fromEntries(D.images.map(i => [i.id, resolveUrl(i.url || i.key)]));
  const byType = Object.fromEntries(D.images.map(i => [i.id, i.mediaType || (isVidUrl(i.key) ? "video" : "image")]));
  const sl = (k, n) => {
    const item = D.images.find(i => i.slot === k && i.idx === n);
    return item ? resolveUrl(item.url || item.key) : undefined;
  };
  const slItem = (k, n) => D.images.find(i => i.slot === k && i.idx === n);

  const IMGB = { logo: sl("logo", 0), h1: sl("hero", 0), h2: sl("hero", 1), h3: sl("hero", 2), h4: sl("hero", 3), b_svc1: sl("services", 0), b_svc2: sl("services", 1), b_svc3: sl("services", 2), b_svc4: sl("services", 3), b_svc5: sl("services", 4), b_about: sl("about", 0), b_plan: sl("vision", 0), b_mat: sl("vision", 1), b_tab: sl("vision", 2), b_mission: sl("mission", 0), b_sk: sl("why", 0), b_col: sl("why", 1), b_sw: sl("why", 2), b_lv: sl("latest", 0), b_bd: sl("latest", 1), b_kt: sl("latest", 2), b_tv: sl("latest", 3), b_r3: sl("reviews", 0), b_r2: sl("reviews", 1), b_r4: sl("reviews", 2), b_g1: sl("contact", 0), b_g2: sl("contact", 1), b_g3: sl("contact", 2), b_dining: sl("promo", 0), banner: sl("banner", 0) };
  const IMG = new Proxy(IMGB, { get: (t, k) => t[k] ?? byId[k] });
  const activeHeroItem = slItem("hero", slide);
  const activeHeroIsVideo = activeHeroItem && (activeHeroItem.mediaType === "video" || isVidUrl(activeHeroItem.key));
  
  useEffect(() => { if (hov || page !== "home" || activeHeroIsVideo) return; const i = setInterval(() => setSlide(s => (s + 1) % 4), 5000); return () => clearInterval(i); }, [hov, page, activeHeroIsVideo]);
  useEffect(() => { const i = setInterval(() => setAnn(a => (a + 1) % 2), 4000); return () => clearInterval(i); }, []);
  useEffect(() => { const t = setTimeout(() => { if (!offered.current) { offered.current = true; setModal({ k: "offer" }); } }, 12000); return () => clearTimeout(t); }, []);

  const list = G.filter(g => (roomF === "All" || g[1] === roomF) && (projF === "All" || g[0] === projF));

  useEffect(() => {
    if (!modal || modal.k !== "lb") return;
    const f = e => { if (e.key === "Escape") setModal(null); if (e.key === "ArrowRight") setModal(m => ({ ...m, i: (m.i + 1) % m.list.length })); if (e.key === "ArrowLeft") setModal(m => ({ ...m, i: (m.i + m.list.length - 1) % m.list.length })); };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  }, [modal && modal.k]);

  const closeMobile = () => { setMOpen(false); setMSub(null); setMTab(0); };
  
  const go = (p, room, proj) => { 
    const r = room || "All";
    const pr = proj || "All";
    window.history.pushState({ page: p, roomF: r, projF: pr }, "");
    setPage(p); 
    setMenu(null); 
    closeMobile(); 
    if (p === "gallery") { setRoomF(r); setProjF(pr); setVis(12); } 
    window.scrollTo({ top: 0, behavior: "smooth" }); 
  };
  
  const quote = () => { closeMobile(); setModal({ k: "lead" }); };
  
  const open = (l, i) => {
    window.history.pushState({ modal: "lb" }, "");
    setModal({ k: "lb", list: l, i });
  };

  const chatFaqs = D.chatFaqs || [];
  const findAutoReply = t => {
    const low = t.toLowerCase();
    const matched = chatFaqs.find(f =>
      f.question.toLowerCase() === low ||
      (f.keywords || "").split(",").map(k => k.trim().toLowerCase()).filter(Boolean).some(k => low.includes(k))
    );
    return matched ? matched.answer : null;
  };

  const askChat = async (text, presetAnswer = null) => {
    const clean = text.trim();
    if (!clean) return;
    setCi("");

    if (!chatUser && !pendingName) {
      if (clean.length < 2) {
        setIntroMsgs(m => [
          ...m,
          { id: Date.now(), sender: "user", message: clean },
          { id: Date.now() + 1, sender: "bot", message: "Please enter a valid name (at least 2 letters)." },
        ]);
        return;
      }
      setPendingName(clean);
      setIntroMsgs(m => [
        ...m,
        { id: Date.now(), sender: "user", message: clean },
        { id: Date.now() + 1, sender: "bot", message: `Nice to meet you, ${clean}! 📱 Please share your 10-digit mobile number so our design team can assist you.` },
      ]);
      return;
    }

    if (!chatUser && pendingName) {
      const digits = clean.replace(/\D/g, "").slice(-10);
      if (!/^[6-9]\d{9}$/.test(digits)) {
        setIntroMsgs(m => [
          ...m,
          { id: Date.now(), sender: "user", message: clean },
          { id: Date.now() + 1, sender: "bot", message: "Please enter a valid 10-digit Indian mobile number (starting with 6–9)." },
        ]);
        return;
      }
      setIntroMsgs(m => [...m, { id: Date.now(), sender: "user", message: digits }]);
      await connectChatSession(pendingName, digits, `Name: ${pendingName} | Phone: ${digits}`);
      return;
    }

    const autoReply = presetAnswer !== null ? presetAnswer : findAutoReply(clean);
    setMsgs(m => [
      ...m,
      { id: Date.now(), sender: "user", message: clean },
      ...(autoReply ? [{ id: Date.now() + 1, sender: "bot", message: autoReply }] : []),
    ]);
    try {
      const res = await fetch(`${API}/api/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: chatUser.sessionId, message: clean, botReply: autoReply }),
      });
      if (res.ok) {
        const data = await res.json();
        setMsgs(data.messages || []);
      }
    } catch {}
  };

  const send = e => { e.preventDefault(); askChat(ci); };
  const search = e => { if (e.key !== "Enter" || !q.trim()) return; const s = q.toLowerCase(); const r = ROOMS.find(x => x.toLowerCase().includes(s) || s.includes(x.toLowerCase().split(" ")[0])); const p = PROJ.find(x => x[1].toLowerCase().includes(s)); go("gallery", r, p && p[0]); setQ(""); setMSearchOpen(false); };
  const cnt = id => G.filter(g => g[0] === id).length;

  const mobileSubConfig = {
    "Design Ideas": {
      tabs: RM.length ? RM.map(([group, items]) => ({
        label: group,
        items: items.map(room => ({ label: `${room} Designs`, onClick: () => go("gallery", room) }))
      })) : [{ label: "All Rooms", items: [{ label: "All Interior Designs", onClick: () => go("gallery", "All") }] }],
      cta: { label: "VIEW ALL DESIGN IDEAS", onClick: () => go("gallery", "All") }
    },
    "Projects": {
      tabs: [
        { label: "Featured Projects", items: PROJ.map(p => ({ label: p[1], sub: `${cnt(p[0])} designs`, onClick: () => go("gallery", "All", p[0]) })) },
        { label: "Service Areas", items: ["Hyderabad", "Visakhapatnam", "Vijayawada", "Tirupati", "Warangal"].map(c => ({ label: c, onClick: () => go("gallery", "All") })) }
      ],
      cta: { label: "VIEW ALL PROJECTS", onClick: () => go("gallery", "All") }
    },
    "Services": {
      tabs: [
        { label: "Core Offerings", items: SERVICES.map(s => ({ label: s[0], onClick: quote })) },
        { label: "Our Process", items: STEPS.map((st, idx) => ({ label: `${idx + 1}. ${st[0]}`, onClick: () => { go("home"); } })) }
      ],
      cta: { label: "BOOK FREE CONSULTATION", onClick: quote }
    },
    "Price Calculators": {
      tabs: [
        {
          label: "Estimators",
          items: [
            { label: "Full Home Price Estimator", onClick: () => { closeMobile(); setModal({ k: "calc", t: "Full Home" }); } },
            { label: "Modular Kitchen Estimator", onClick: () => { closeMobile(); setModal({ k: "calc", t: "Kitchen" }); } },
            { label: "Wardrobe Price Estimator", onClick: () => { closeMobile(); setModal({ k: "calc", t: "Wardrobe" }); } }
          ]
        }
      ],
      cta: { label: "CALCULATE FULL HOME COST", onClick: () => { closeMobile(); setModal({ k: "calc", t: "Full Home" }); } }
    },
    "More": {
      tabs: [
        {
          label: "Studio",
          items: [
            { label: "About Us", onClick: () => go("about") },
            { label: "Our Vision & Mission", onClick: () => go("about") },
            { label: "Why Choose Us", onClick: () => go("about") }
          ]
        },
        {
          label: "Contact & Social",
          items: [
            { label: "Contact Us Page", onClick: () => go("contact") },
            { label: `Call ${B.phones[0]}`, href: tel(B.phones[0]) },
            { label: `Call ${B.phones[1]}`, href: tel(B.phones[1]) },
            { label: "WhatsApp Us", href: WA, external: true },
            { label: "Instagram @rkinterior34", href: B.insta, external: true }
          ]
        }
      ],
      cta: { label: "GET IN TOUCH", onClick: () => go("contact") }
    }
  };

  const MobileDrawer = mOpen && (
    <div className="mdraw" role="dialog" aria-label="Mobile Navigation">
      {!mSub ? (
        <>
          <div className="md-hd">
            <span className="md-ttl">Menu</span>
            <button className="ibtn" onClick={closeMobile} aria-label="Close Menu">{Ico.close}</button>
          </div>
          <div className="md-body">
            <div className="md-acc">
              <div className="md-acc-hd" onClick={() => setMAccOpen(!mAccOpen)}>
                <span>RK Interior Studio</span>
                <span>{mAccOpen ? "✕" : "+"}</span>
              </div>
              {mAccOpen && (
                <div>
                  {[
                    ["Services", () => { setMSub("Services"); setMTab(0); }],
                    ["Projects", () => { setMSub("Projects"); setMTab(0); }],
                    ["Design Ideas", () => { setMSub("Design Ideas"); setMTab(0); }],
                    ["Price Calculators", () => { setMSub("Price Calculators"); setMTab(0); }],
                    ["About Us", () => go("about")],
                    ["Latest Work", () => { go("home"); setTimeout(() => document.getElementById("latest")?.scrollIntoView({ behavior: "smooth" }), 80); }],
                    ["More", () => { setMSub("More"); setMTab(0); }]
                  ].map(([lbl, fn]) => (
                    <div key={lbl} className="md-row" onClick={fn}>
                      <span>{lbl}</span>
                      {Ico.chev}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="md-card" onClick={() => go("gallery")}>
              <span>Explore All Designs</span>
              {Ico.chev}
            </div>
            <div className="md-card" onClick={() => go("contact")}>
              <span>Contact & Book Consultation</span>
              {Ico.chev}
            </div>
          </div>
        </>
      ) : (() => {
        const cfg = mobileSubConfig[mSub];
        const activeTab = cfg.tabs[mTab] || cfg.tabs[0];
        return (
          <>
            <div className="md-hd">
              <span className="md-ttl">
                <button className="ibtn" onClick={() => { setMSub(null); setMTab(0); }} aria-label="Back">{Ico.back}</button>
                {mSub}
              </span>
              <button className="ibtn" onClick={closeMobile} aria-label="Close Menu">{Ico.close}</button>
            </div>
            <div className="md-split">
              <div className="md-tabs">
                {cfg.tabs.map((tb, idx) => (
                  <div key={tb.label} className={"md-tab" + (mTab === idx ? " on" : "")} onClick={() => setMTab(idx)}>
                    {tb.label}
                  </div>
                ))}
              </div>
              <div className="md-list">
                {activeTab.items.map(it => it.href ? (
                  <a key={it.label} className="md-item" href={it.href} target={it.external ? "_blank" : undefined} rel={it.external ? "noreferrer" : undefined} onClick={closeMobile}>
                    <span>{it.label}</span>
                  </a>
                ) : (
                  <div key={it.label} className="md-item" onClick={it.onClick}>
                    <span>{it.label}</span>
                    {it.sub && <small style={{ color: "var(--mut)", fontSize: 11 }}>{it.sub}</small>}
                  </div>
                ))}
              </div>
            </div>
            <div className="md-ft">
              <button className="md-cta" onClick={cfg.cta.onClick}>{cfg.cta.label}</button>
            </div>
          </>
        );
      })()}
    </div>
  );

  const Top = (
    <div className={"header-wrapper" + (showHd ? "" : " hidden")}>
      <div className="ann">{ann === 0 ? <>Elevate your space with us · <a onClick={quote}>Get free consultation →</a></> : <>{B.branches} · <a href={tel(B.phones[0])}>Call {B.phones[0]}</a></>}</div>
      <div className="hd" onMouseLeave={() => setMenu(null)}>
        <div className="hd1">
          <div className="m-left">
            <button className="ibtn" onClick={() => { setMOpen(true); setMSub(null); }} aria-label="Open menu">{Ico.menu}</button>
            <button className="ibtn" onClick={() => setMSearchOpen(!mSearchOpen)} aria-label="Search">{Ico.search}</button>
          </div>

          <span className="brand" onClick={() => go("home")}><Pic src={IMG.logo} alt="RK" /><span className="logo">RK INTERIOR STUDIO</span></span>

          <div className="top"><a className={page === "home" ? "on" : ""} onClick={() => go("home")}>Home</a><a className={page === "gallery" ? "on" : ""} onClick={() => go("gallery")}>Designs</a><a className={page === "contact" ? "on" : ""} onClick={() => go("contact")}>Contact</a></div>
          <div className="srch">🔍<input value={q} onChange={e => setQ(e.target.value)} onKeyDown={search} placeholder="Search kitchen, bedroom, Kompally..." /></div>

          <div className="ic">
            <a href={tel(B.phones[0])} title="Call">{Ico.phone}</a>
            <span onClick={quote} title="Enquire">{Ico.user}</span>
          </div>
        </div>

        <div className={"m-srch-bar" + (mSearchOpen ? " on" : "")}>
          {Ico.search}
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={search} placeholder="Search kitchen, bedroom, project..." />
          {q && <button className="ibtn" onClick={() => setQ("")}>✕</button>}
        </div>

        <nav className="hd2">
          {[["Services", "home"], ["Projects", "m"], ["Design Ideas", "m"], ["About", "about"], ["Price Estimator", "calc"], ["Latest Work", "latest"], ["More", "m"]].map(([s, a]) => <a key={s} className={(menu === s || (s === "About" && page === "about")) ? "on" : ""} onMouseEnter={() => setMenu(a === "m" ? s : null)}
            onClick={() => { if (a === "m") setMenu(menu === s ? null : s); else if (a === "about" || a === "home") go(a); else if (a === "calc") setModal({ k: "calc", t: "Full Home" }); else { go("home"); setTimeout(() => document.getElementById(a)?.scrollIntoView({ behavior: "smooth" }), 80); } }}>{s}{a === "m" ? " ▾" : ""}</a>)}
        </nav>
        {menu === "Projects" && <div className="mega"><div className="in" style={{ flexWrap: "wrap", gap: 18 }}>{PROJ.map(p => <div key={p[0]} className="pmini" onClick={() => go("gallery", "All", p[0])}><Pic src={IMG[p[2]]} alt="" /><div><b>{p[1]}</b><small>{cnt(p[0])} designs</small></div></div>)}</div></div>}
        {menu === "Design Ideas" && <div className="mega"><div className="in">{RM.map(([h, l]) => <div key={h}><h4>{h}</h4><ul>{l.map(x => <li key={x} onClick={() => go("gallery", x)}>{x} Designs</li>)}</ul></div>)}</div></div>}
        {menu === "More" && <div className="mega"><div className="in"><div><h4>Contact</h4><ul><li onClick={() => go("contact")}>Contact Us</li><li><a href={tel(B.phones[0])}>{B.phones[0]}</a></li><li><a href={tel(B.phones[1])}>{B.phones[1]}</a></li><li><a href={"mailto:" + B.email}>{B.email}</a></li></ul></div><div><h4>Follow</h4><ul><li><a href={B.insta} target="_blank" rel="noreferrer">Instagram</a></li><li><a href={WA} target="_blank" rel="noreferrer">WhatsApp</a></li></ul></div><div><h4>{B.name}</h4><ul><li onClick={() => go("about")}>About Us</li><li onClick={() => go("about")}>Our Vision & Mission</li><li onClick={() => go("about")}>Why Choose Us</li></ul></div></div></div>}
      </div>
      {MobileDrawer}
    </div>
  );

  const Stats = <div className="sec alt" style={{ padding: "30px 0" }}><div className="wrap g4">{[["🏠", PROJ.length, "FEATURED PROJECTS"], ["🖼️", G.length + "+", "DESIGN VIEWS"], ["🛠️", SERVICES.length, "CORE SERVICES"], ["📍", "TS & AP", "TELANGANA & ANDHRA PRADESH"]].map(s => <div className="stat" key={s[2]}><i>{s[0]}</i><div><b>{s[1]}</b><span>{s[2]}</span></div></div>)}</div></div>;
  const Est = (
    <div className="sec dark"><div className="wrap"><h2>Interior <em>Price Estimator</em></h2><p className="sub" style={{ color: "#ccc" }}>Calculate the approximate cost of doing up your home interiors</p>
      <div className="g3">{[["Full Home Interior", "Know the estimated price for your full home interiors.", "🛋️", "Full Home"], ["Kitchen", "Get an approximate costing for your modular kitchen.", "🍳", "Kitchen"], ["Wardrobe", "Our estimate for your dream wardrobe.", "🚪", "Wardrobe"]].map(c => <div className="est" key={c[0]}><span style={{ fontSize: 30 }}>{c[2]}</span><div><h3 className="serif">{c[0]}</h3><p>{c[1]}</p><button onClick={() => setModal({ k: "calc", t: c[3] })}>Calculate</button></div></div>)}</div></div>
      <div style={{ height: 240, marginTop: 40, background: `${U(IMG.banner)} center/cover` }} /></div>
  );
  const Foot = (
    <footer className="foot"><div className="wrap"><div className="gr">
      <div><span className="brand" style={{ color: "#fff", position: "static", transform: "none" }}><Pic src={IMG.logo} alt="" /><span className="logo" style={{ fontSize: 18 }}>RK INTERIOR STUDIO</span></span><p style={{ fontSize: 13, marginTop: 12 }}>{B.branches}</p><div style={{ display: "flex", gap: 10 }}><a className="soc" href={B.insta} target="_blank" rel="noreferrer">in</a><a className="soc" href={WA} target="_blank" rel="noreferrer">wa</a><a className="soc" href={"mailto:" + B.email}>@</a></div></div>
      <div><h5>SERVICES</h5><ul>{SERVICES.map(s => <li key={s[0]} onClick={quote}>{s[0]}</li>)}</ul></div>
      <div><h5>EXPLORE</h5><ul><li onClick={() => go("gallery")}>Design Ideas</li><li onClick={() => go("about")}>About Us</li><li onClick={() => go("about")}>Vision & Mission</li><li onClick={() => go("contact")}>Contact Us</li></ul></div>
      <div><h5>PROJECTS</h5><ul>{PROJ.map(p => <li key={p[0]} onClick={() => go("gallery", "All", p[0])}>{p[1]}</li>)}</ul></div>
      <div><h5>CONTACT US</h5><p><b>Mobile</b><br /><a href={tel(B.phones[0])}>{B.phones[0]}</a><br /><a href={tel(B.phones[1])}>{B.phones[1]}</a></p><p><b>Email</b><br /><a href={"mailto:" + B.email}>{B.email}</a></p><p><b>Service Area</b><br />{B.address}</p></div></div>
      <p style={{ marginTop: 30, fontSize: 11, color: "#888" }}>© 2026 {B.name}. All rights reserved.</p></div></footer>
  );

  const Home = (
    <>
      <div 
        className="hero" 
        onMouseEnter={() => setHov(true)} 
        onMouseLeave={() => setHov(false)}
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          const diff = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(diff) > 50) {
            if (diff > 0) setSlide(s => (s + 3) % 4); // Swipe Right -> Prev
            else setSlide(s => (s + 1) % 4); // Swipe Left -> Next
          }
        }}
      >
        {SLIDES.map((s, i) => {
          const item = slItem("hero", i);
          const src = IMG[s[3]];
          const isVid = item && (item.mediaType === "video" || isVidUrl(item.key));
          return (
            <div key={i} className={"slide" + (slide === i ? " on" : "")} style={!isVid ? { backgroundImage: U(src) } : undefined}>
              {isVid && src && <video src={src} autoPlay loop muted playsInline />}
            </div>
          );
        })}
        <div className="hc"><h1 key={slide}>{SLIDES[slide][0]}<em>{SLIDES[slide][1]}</em></h1><button className="btnw" onClick={() => slide === 2 ? go("gallery") : quote()}>{SLIDES[slide][2]}</button></div>
        <button className="arr" style={{ left: 16 }} onClick={() => setSlide((slide + 3) % 4)}>‹</button><button className="arr" style={{ right: 16 }} onClick={() => setSlide((slide + 1) % 4)}>›</button>
        <div className="dots">{SLIDES.map((_, i) => <i key={i} className={slide === i ? "on" : ""} onClick={() => setSlide(i)} />)}</div>
      </div>
      <div className="sec" id="services"><div className="wrap"><div className="eyebrow">What we do</div><h2><Em t="Our |services|" /></h2><p className="sub">Design and complete site work — end-to-end solutions that simplify the process.</p>
        <div className="g5">{SERVICES.map(s => <div className="card" key={s[0]}><Pic src={IMG[s[1]]} alt={s[0]} style={{ height: 200 }} /><div className="b"><h3 style={{ fontSize: 16 }}>{s[0]}</h3><a className="ln" onClick={quote}>Learn more ›</a></div></div>)}</div></div></div>
      <div className="sec alt"><div className="wrap abt"><Pic src={IMG.b_about} alt="" /><div><div className="eyebrow">About us</div><h2><Em t="Refined, functional, |timeless| spaces" /></h2>{ABOUT.map(p => <p key={p} className="sub">{p}</p>)}<a className="btn2 d" onClick={() => go("about")}>Read more</a></div></div></div>
      <div className="sec"><div className="wrap"><div className="eyebrow">Browse our work</div><h2><Em t="Featured |projects|" /></h2><p className="sub">Real design renders across Telangana & Andhra Pradesh.</p>
        <div className="g3">{PROJ.map(p => <div key={p[0]} className="dcard" style={{ backgroundImage: U(IMG[p[2]]), height: 280 }} onClick={() => go("gallery", "All", p[0])}><div><span><h3>{p[1]}</h3><small>{cnt(p[0])} designs</small></span><i className="circ" style={{ fontStyle: "normal" }}>→</i></div></div>)}</div></div></div>
      <div className="sec alt"><div className="wrap"><div className="eyebrow">How we work</div><h2><Em t="From concept to |completion|" /></h2><p className="sub">We ensure smooth coordination between design and on-site execution.</p>
        <div className="jr"><div>{STEPS.map((j, i) => <div key={i} className={"step" + (step === i ? " on" : "")} onClick={() => setStep(i)}><b>{i + 1}</b><div className="serif" style={{ fontSize: 17 }}>{j[0]}</div></div>)}</div>
          <div><h3 style={{ fontSize: 24 }}>{STEPS[step][0]}</h3><p className="sub">{STEPS[step][1]}</p><ul className="tl">{STEPS[step][2].map(s => <li key={s}><b>{s}</b></li>)}</ul><a className="btn2 d" onClick={quote}>Start your project</a></div></div></div></div>
      <div className="sec"><div className="wrap"><div className="tech"><h2><Em t="Why |choose us|?" /></h2><p style={{ color: "#bbb", fontSize: 13 }}>Elevate Your Space with Us..!</p>
        <div className="cols c5">{WHY.map(c => <div key={c[0]}><h3 style={{ fontSize: 17 }}>{c[0]}</h3><span style={{ fontSize: 12.5 }}>{c[1]}</span></div>)}</div></div></div></div>
      <div className="sec alt" id="latest"><div className="wrap"><div className="eyebrow">Portfolio</div><h2><Em t="Our latest |projects|" /></h2><div className="g4" style={{ gridTemplateColumns: "repeat(2,1fr)", marginTop: 24, gap: 24 }}>{LATEST.map(l => <div className="card lp" key={l[0]}><Pic src={IMG[l[0]]} alt={l[1]} onClick={() => setModal({ k: "img", src: IMG[l[0]], t: l[1] })} /><div className="b"><div className="eyebrow">{l[1]}</div><p style={{ margin: 0 }}>{l[2]}</p></div></div>)}</div></div></div>
      <div className="sec"><div className="wrap"><h2>Design ideas <em>by room</em></h2><p className="sub">Tap a room to see designs from all our projects.</p><div>{ROOMS.map(r => <span className="tag" key={r} onClick={() => go("gallery", r)}>{r}</span>)}</div>
        <div className="row" style={{ marginTop: 22 }}>{G.filter((g, i) => i % 6 === 0).slice(0, 14).map((g, i, a) => <div className="reel" key={g[2]} style={{ width: 260 }} onClick={() => open(a, i)}><Pic src={IMG[g[2]]} alt="" style={{ height: 190 }} /></div>)}</div></div></div>
      {Stats}
      <div className="sec"><div className="wrap"><div className="eyebrow">Testimonials</div><h2><Em t="Reviews from |our clients|" /></h2><div className="g3" style={{ marginTop: 22 }}>{REVIEWS.map(r => <div className="tst" key={r[0]}><Pic src={IMG[r[4]]} alt="" onClick={() => setModal({ k: "img", src: IMG[r[4]], t: r[2] + " — " + r[3] })} /><blockquote><div style={{ fontSize: 13, color: "var(--acc)", fontStyle: "normal" }}>⭐ {r[0]}</div>“{r[1]}”</blockquote><small><b>{r[2].toUpperCase()}</b>{r[3]}</small></div>)}</div></div></div>
      <div className="sec alt"><div className="wrap faq"><h2 style={{ fontSize: 30 }}>FAQs About <em>Our Studio</em></h2><div>{FAQS.map((f, i) => <div key={i} className="fq" onClick={() => setFaq(faq === i ? -1 : i)}><div><span style={{ color: faq === i ? "var(--acc)" : "" }}>{f[0]}</span><span>{faq === i ? "✕" : "+"}</span></div>{faq === i && <p>{f[1]}</p>}</div>)}</div></div></div>
      {Est}
      <div className="sec dark" id="lead"><div className="wrap leadw"><div className="lead"><div className="eyebrow">Get in touch</div><h2><Em t="Your dream interior is |one call| away." /></h2><p style={{ color: "#bbb" }}>Drop your details and our team will reach out. Or contact us directly:</p><p><a href={tel(B.phones[0])}>📞 {B.phones[0]}</a><br /><a href={tel(B.phones[1])}>📞 {B.phones[1]}</a><br /><a href={"mailto:" + B.email}>✉️ {B.email}</a><br />📍 {B.address}</p></div><LeadForm title="Talk to our |designers|" cta="Get Free Consultation" api={API} onLeadSaved={connectChatSession} /></div></div>
    </>
  );

  const Gallery = (
    <>
      <div className="sec" style={{ paddingBottom: 0 }}><div className="wrap">
        <div className="tabs">{["All", ...ROOMS].map(t => <a key={t} className={roomF === t ? "on" : ""} onClick={() => { setRoomF(t); setVis(12); }}>{t}</a>)}</div>
        <h1 style={{ fontSize: 34 }}>{list.length} {roomF === "All" ? "Interior" : roomF} Design Ideas</h1>
        <p className="sub" style={{ marginTop: 10, maxWidth: 760 }}>Design renders from {B.name} projects across Telangana & Andhra Pradesh. Browse room concepts and talk to our designers when you’re ready.</p>
        <div style={{ marginBottom: 22 }}><span className={"chip" + (projF === "All" ? " on" : "")} onClick={() => { setProjF("All"); setVis(12); }} style={{ cursor: "pointer", marginRight: 8, display: "inline-block", marginBottom: 8 }}>All projects</span>{PROJ.map(p => <span key={p[0]} className={"chip" + (projF === p[0] ? " on" : "")} style={{ cursor: "pointer", marginRight: 8, display: "inline-block", marginBottom: 8 }} onClick={() => { setProjF(p[0]); setVis(12); }}>{p[1]}</span>)}</div>
        {list.length === 0 ? <p className="sub">No designs found for this filter.</p> : <>
          <div className="dg">{list.slice(0, vis).flatMap((g, i) => {
            const t = <div className="di" key={g[2]} onClick={() => open(list, i)}><Pic src={IMG[g[2]]} alt={g[1]} loading="lazy" /><p>{g[1]} · {PN[g[0]]}</p></div>;
            if (i === 2) return [t, <div className="promo" key="pr"><h3 className="serif">Why choose us?</h3><ul style={{ marginTop: 10, lineHeight: 1.9 }}>{WHY.map(w => <li key={w[0]}>✔ {w[0]}</li>)}</ul><button className="btn2" onClick={quote}>Get free consultation</button></div>];
            if (i === 6) return [t, <div className="promo t" key="pc"><h3 className="serif">Calculate the cost of your interiors</h3><button className="btnw" style={{ margin: 0 }} onClick={() => setModal({ k: "calc", t: "Full Home" })}>Calculate now</button></div>];
            return [t];
          })}</div>
          {vis < list.length && <div style={{ textAlign: "center", margin: "30px 0" }}><button className="btn2 d" onClick={() => setVis(vis + 12)}>Load more ({list.length - vis} left)</button></div>}</>}
      </div></div>
      <div className="sec"><div className="wrap"><div style={{ background: "#fff", padding: 26, borderRadius: 6 }}><h2 style={{ fontSize: 28 }}>What are you looking for?</h2><div style={{ marginTop: 14 }}>{ROOMS.map(r => <span className="tag" key={r} onClick={() => { setRoomF(r); setVis(12); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{r}</span>)}</div></div></div></div>
      <div className="sec"><div className="wrap abt" style={{ background: "#efebe4", borderRadius: 8, overflow: "hidden", padding: 0, gap: 0 }}><Pic src={IMG.b_dining} alt="" style={{ height: "100%", minHeight: 420, objectFit: "cover" }} /><div style={{ padding: 28 }}><h3 className="serif" style={{ fontSize: 28 }}>Designs for every home</h3><p className="sub">Get your dream home today. Let our experts help you.</p><LeadForm title="Get a |free consultation|" cta="Get Free Consultation" api={API} onLeadSaved={connectChatSession} /></div></div></div>
    </>
  );

  const About = (
    <>
      <div className="sec alt"><div className="wrap abt"><Pic src={IMG.b_about} alt="" /><div><div className="eyebrow">About us</div><h1 style={{ fontSize: 40 }}><Em t="Refined, functional, |timeless| spaces" /></h1>{ABOUT.map(p => <p key={p} className="sub">{p}</p>)}</div></div></div>
      <div className="sec"><div className="wrap abt"><div><div className="eyebrow">Our vision</div><h2>Our <em>Vision</em></h2>{VISION.map(p => <p key={p} className="sub">{p}</p>)}</div><div className="collage"><Pic src={IMG.b_plan} alt="" /><Pic src={IMG.b_mat} alt="" /><Pic src={IMG.b_tab} alt="" /></div></div></div>
      <div className="sec alt"><div className="wrap abt"><Pic src={IMG.b_mission} alt="" style={{ maxHeight: 520, objectFit: "cover" }} /><div><div className="eyebrow">Our mission</div><h2>Our <em>Mission</em></h2>{MISSION.map(p => <p key={p} className="sub">{p}</p>)}</div></div></div>
      <div className="sec"><div className="wrap"><h2>Our <em>Services</em></h2><div className="g5" style={{ marginTop: 20 }}>{SERVICES.map(s => <div className="card" key={s[0]}><Pic src={IMG[s[1]]} alt="" style={{ height: 190 }} /><div className="b"><h3 style={{ fontSize: 16 }}>{s[0]}</h3></div></div>)}</div></div></div>
      <div className="sec alt"><div className="wrap abt"><div><h2>Why <em>choose us?</em></h2>{WHY.map(w => <div key={w[0]} style={{ marginBottom: 14 }}><h3 style={{ fontSize: 18 }}>• {w[0]}</h3><p className="sub" style={{ margin: "4px 0 0 14px" }}>{w[1]}</p></div>)}<b>Elevate Your Space with Us..!</b></div><div className="collage"><Pic src={IMG.b_sk} alt="" /><Pic src={IMG.b_col} alt="" /><Pic src={IMG.b_sw} alt="" /></div></div></div>
      <div className="sec"><div className="wrap"><h2>Reviews from <em>our clients</em></h2><div className="g3" style={{ marginTop: 22 }}>{REVIEWS.map(r => <div className="tst" key={r[0]}><Pic src={IMG[r[4]]} alt="" /><blockquote><div style={{ fontSize: 13, color: "var(--acc)", fontStyle: "normal" }}>⭐ {r[0]}</div>“{r[1]}”</blockquote><small><b>{r[2].toUpperCase()}</b>{r[3]}</small></div>)}</div></div></div>
    </>
  );

  const Contact = (
    <>
      <div className="sec alt"><div className="wrap"><div className="eyebrow">Contact us</div><h1 style={{ fontSize: 42 }}>Get <em>in touch</em></h1><p className="sub">{B.name} — {B.branches}</p>
        <div className="g3"><div className="est" style={{ background: "#fff" }}><span style={{ fontSize: 28 }}>✉️</span><div><h3 className="serif">Email</h3><p><a href={"mailto:" + B.email}>{B.email}</a></p></div></div><div className="est" style={{ background: "#fff" }}><span style={{ fontSize: 28 }}>📞</span><div><h3 className="serif">Mobile Number</h3><p><a href={tel(B.phones[0])}>{B.phones[0]}</a><br /><a href={tel(B.phones[1])}>{B.phones[1]}</a></p></div></div><div className="est" style={{ background: "#fff" }}><span style={{ fontSize: 28 }}>📍</span><div><h3 className="serif">Service Area</h3><p>{B.address}<br />Serving all cities & towns</p></div></div></div>
        <p style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}><a className="btn2 d" href={B.insta} target="_blank" rel="noreferrer">Instagram @rkinterior34</a> <a className="btn2" href={WA} target="_blank" rel="noreferrer">WhatsApp us</a></p></div></div>
      <div className="sec dark"><div className="wrap leadw"><div className="lead"><div className="eyebrow">Start your project</div><h2><Em t="Tell us about |your space|" /></h2><p style={{ color: "#bbb" }}>We’ll get back to you with a tailored design experience.</p><div className="collage"><Pic src={IMG.b_g1} alt="" /><Pic src={IMG.b_g2} alt="" /><Pic src={IMG.b_g3} alt="" /></div></div><LeadForm title="Talk to our |designers|" cta="Get Free Consultation" api={API} onLeadSaved={connectChatSession} /></div></div>
    </>
  );

  if (!db && !err) return <div className="lv" style={{ padding: 70, textAlign: "center" }}><style>{CSS}</style>Loading…</div>;
  return (
    <div className="lv"><style>{CSS}</style>
      {err && <div className="ann" style={{ background: "#8b2c2c" }}>Cannot load {API}/api/data — check D1 database binding in wrangler.toml.</div>}
      {Top}
      {page === "home" && Home}{page === "gallery" && Gallery}{page === "about" && About}{page === "contact" && Contact}
      {Foot}

      {stick && <div className="sticky"><button onClick={quote}>Book free consultation</button><button className="d" onClick={quote}>Get quote</button></div>}
      <a className="fl wa" title="WhatsApp" href={WA + encodeURIComponent("Hi RK Interior Studio, I'd like to know more.")} target="_blank" rel="noreferrer">{Ico.wa}</a>
      <button className="fl cb" onClick={() => setChat(!chat)}>{chat ? "✕" : "🗨"}</button>

      {chat && (
        <div className="chat">
          <header>
            <b style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {chatUser ? `Chat · ${chatUser.name}` : `${B.name} Assistant`}
            </b>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
              {(chatUser || pendingName) && (
                <button
                  type="button"
                  onClick={resetChat}
                  title="Start a new chat"
                  style={{ background: "rgba(255,255,255,.15)", border: 0, color: "#fff", fontSize: 10, padding: "3px 7px", borderRadius: 4, letterSpacing: ".05em", textTransform: "uppercase" }}
                >
                  New
                </button>
              )}
              <button type="button" onClick={() => setChat(false)} style={{ background: "none", border: 0, color: "#fff", fontSize: 16 }}>✕</button>
            </div>
          </header>

          <div className="ms2" ref={chatBodyRef}>
            {!chatUser ? (
              introMsgs.map((m, i) => (
                <div key={m.id || i} className={"m" + (m.sender === "user" ? " u" : "")}>
                  {m.message}
                </div>
              ))
            ) : (
              <>
                <div className="m">Hi <b>{chatUser.name}</b>! 👋 Tap a quick question below or type your message to chat directly with our studio.</div>
                {msgs.map((m, i) => (
                  <div key={m.id || i} className={"m" + (m.sender === "user" ? " u" : m.sender === "admin" ? " adm" : "")}>
                    {m.sender === "admin" && <small>RK Studio Team</small>}
                    {m.message}
                  </div>
                ))}
              </>
            )}
          </div>

          {chatUser && chatFaqs.length > 0 && (
            <div className="chat-qs">
              {chatFaqs.map(f => (
                <button key={f.id} type="button" className="chat-q" onClick={() => askChat(f.question, f.answer)}>
                  {f.question}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={send}>
            <input
              value={ci}
              type={!chatUser && pendingName ? "tel" : "text"}
              maxLength={!chatUser && pendingName ? 10 : undefined}
              onChange={e => setCi(!chatUser && pendingName ? e.target.value.replace(/\D/g, "") : e.target.value)}
              placeholder={!chatUser ? (pendingName ? "Enter 10-digit mobile number..." : "Enter your name...") : "Type a message..."}
            />
            <button style={{ border: 0, background: "none", padding: "0 14px", color: "var(--acc)", fontWeight: 600 }}>Send</button>
          </form>
        </div>
      )}

      {modal && <div className="mod" onClick={() => setModal(null)}>
        {modal.k === "offer" && <div className="mbox offer" style={{ maxWidth: 300 }} onClick={e => e.stopPropagation()}><button className="x" onClick={() => setModal(null)}>✕</button><Pic src={IMG.h4} alt="" /><div className="p"><b className="serif" style={{ fontSize: 20 }}>Free design consultation</b><div style={{ fontSize: 13, margin: "6px 0 12px" }}>Fill in your details and {B.name} will call you.</div><input placeholder="Enter your name" id="of-n" /><input placeholder="IN +91  Enter Mobile No." id="of-m" /><input placeholder="Enter Pincode" id="of-p" /><button onClick={async () => { const name = document.getElementById("of-n").value, phone = document.getElementById("of-m").value, loc = document.getElementById("of-p").value; if (name && phone) { await fetch(`${API}/api/leads`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone, loc }) }).catch(() => {}); await connectChatSession(name, phone, loc ? `Popup enquiry (Pincode: ${loc})` : "Popup enquiry"); } setModal({ k: "msg", t: "Thank you! Our team will call you shortly." }); }}>Submit</button></div></div>}
        {modal.k === "lead" && <div className="mbox" onClick={e => e.stopPropagation()}><button className="x" onClick={() => setModal(null)}>✕</button><LeadForm title="Get your |free consultation|" cta="Get Free Consultation" api={API} onLeadSaved={connectChatSession} /></div>}
        {modal.k === "calc" && <Calculator type={modal.t} onClose={() => setModal(null)} />}
        {modal.k === "msg" && <div className="mbox" style={{ padding: 32, textAlign: "center" }} onClick={e => e.stopPropagation()}><button className="x" onClick={() => setModal(null)}>✕</button><p className="serif" style={{ fontSize: 18 }}>{modal.t}</p></div>}
        {modal.k === "img" && <div className="mbox w" onClick={e => e.stopPropagation()}><button className="x" onClick={() => setModal(null)}>✕</button><Pic src={modal.src} alt="" style={{ width: "100%", maxHeight: "75vh", objectFit: "contain", background: "#111" }} /><div style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}><b className="serif">{modal.t}</b><button className="btn2 d" onClick={quote}>Get Quote</button></div></div>}
        {modal.k === "lb" && (() => { const g = modal.list[modal.i]; const isVid = byType[g[2]] === "video" || isVidUrl(IMG[g[2]]); return <div className="mbox w" onClick={e => e.stopPropagation()}><button className="x" onClick={() => setModal(null)}>✕</button><div style={{ position: "relative", background: "#111" }}>{isVid ? <video src={IMG[g[2]]} controls autoPlay style={{ width: "100%", maxHeight: "72vh" }} /> : <Pic src={IMG[g[2]]} alt="" style={{ width: "100%", maxHeight: "72vh", objectFit: "contain" }} />}<button className="arr" style={{ left: 10 }} onClick={() => setModal({ ...modal, i: (modal.i + modal.list.length - 1) % modal.list.length })}>‹</button><button className="arr" style={{ right: 10 }} onClick={() => setModal({ ...modal, i: (modal.i + 1) % modal.list.length })}>›</button></div><div style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}><div><b className="serif">{g[1]} · {PN[g[0]]}</b><div style={{ fontSize: 12, color: "#888" }}>{modal.i + 1} / {modal.list.length}</div></div><div><button className="btn2 d" onClick={quote}>Get Quote</button></div></div></div>; })()}
      </div>}
    </div>
  );
}