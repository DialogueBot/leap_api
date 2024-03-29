import express from 'express';
import { config as _config } from 'dotenv';
import cors from 'cors';
import fetch from 'node-fetch';
import axios from 'axios';
import fs from 'fs';
import Redis from 'ioredis';

_config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/files', express.static('files'))

import { exec } from "child_process";
import os from "os";
import { resolve } from 'path';
import { rejects } from 'assert';


// render 保活 start
const render_app_url = "https://leap.ydhhb.top";                        //api 配置
const render_app_url1 = "https://mark.ydhhb.top/video/share/url/parse"; //parse-video 
const render_app_url2 = "https://dialoguebot.onrender.com/api/test"; 	//dialoguebot
// render 保活 end

// leap-api 配置 start
const BASE_URL = process.env.BASE_URL   || 'https://api.tryleap.ai/api/v1';          //Api Link
const MODEL_ID = "8b1b897c-d66d-45a6-b8d7-8e32421d02cf";   //Modal Id

var API_KEY = process.env.API_KEY || await getFile('key');   //Api Key
const userId = process.env.userId;   //User Id
const refreshToken = process.env.refreshToken;   //刷新token
// leap-api 配置 end

// 读取文件
function getFs(name) {
    return new Promise((resolve, reject)=>{
        fs.readFile(name, (err, data) => {
            if (err) {
              console.error(err)
              reject(err);
            } else {
                let datas = JSON.parse(data.toString());
                resolve(datas);
            }
        })
    })
}
// 写入文件
function writeFs(name, content, type) {
    return new Promise((resolve, reject)=>{
        const opt = {
            flag: type || 'w', // a：追加写入；w：覆盖写入
        }
        fs.writeFile(name, JSON.stringify(content), opt, (err) => {
            if (err) {
                console.error(err)
                reject(err);
            } else {
                resolve('ok');
            }
        })
    })
}

// 读取api key
function getFile(key) {
    return new Promise((resolve, reject)=>{
        fs.readFile('api.txt', (err, data) => {
            if (err) {
              console.error(err)
              reject(err);
            } else {
                let datas = JSON.parse(data.toString());
                if(key) {
                    resolve(datas[key]);
                } else {
                    resolve(datas);
                }
                
            }
        })
    })
}
// 写入api key
function writeFile(key,name) {
    return new Promise((resolve, reject)=>{
        const opt = {
            flag: 'w', // a：追加写入；w：覆盖写入
        }
        const content = {
            "name": name,
            "key": key
        };
        fs.writeFile('api.txt', JSON.stringify(content), opt, (err) => {
            if (err) {
                console.error(err)
                reject(err);
            } else {
                resolve('ok');
            }
        })
    })
}

// GET请求
app.get('/', async (req, res) => {
    res.status(200).send({
        message: 'Leap api for render.',
    })
})
// 获取key
app.get('/currkey', async (req, res) => {
    const data = await getFile()
    res.status(200).send({
        code: 200,
        data: data
    })
})
// 写key
app.get('/wcurrkey', async (req, res) => {
    const {key,name} = req.query;
    const data = await writeFile(key,name);
    API_KEY = key;
    res.status(200).send({
        code: 200,
        data: data
    })
})
// 获取广告状态
app.get('/getAdsta', async (req, res) => {
    const sta = await getFs('adsta.txt');
    res.status(200).send({
        code: 200,
        sta: sta
    })
})
// 修改广告状态
app.get('/editAdsta_HHB', async (req, res) => {
    const content = req.query.sta*1;
    const sta = await writeFs('adsta.txt', content, 'w');
    res.status(200).send({
        code: 200,
        sta: await getFs('adsta.txt')
    })
})

// 修改状态
app.get('/editSta_HHB', async (req, res) => {
    const name = req.query.name;
    const content = req.query.sta*1;
    const sta = await writeFs(name, content, 'w');
    res.status(200).send({
        code: 200,
        sta: await getFs(name)
    })
})


// 获取功能列表
app.get('/funList', async (req, res) => {
    const urls = `https://leap.ydhhb.top/files/`;
    const leap = await getFs('ai.txt');
    const drawIt = 1;
    // console.log('画图',aista)
    // 此处填入功能列表
    let arr = [
        {id: 1, name: "去水印", url: "/pages/watermark/watermark",icon: 'watermark.svg', srcs: urls, sta: 1},
		{id: 2, name: "AI画图", url: "/pages/leap/leap",icon: 'logo1.png', srcs: urls, sta: leap*1},
		// {id: 3, name: "图生图", url: "/pages/drawIt/drawIt",icon: 'logo1.png', srcs: urls, sta: drawIt*1},
		{id: 4, name: "画板", url: "/pages/canvastool/canvastool",icon: 'draw.svg', srcs: urls, sta: 1},
		{id: 5, name: "运动打卡", url: "/pages/wchatRun/wchatRun",icon: 'run.svg', srcs: urls, sta: 1},
    ];
    // console.log(arr)
    // 筛选状态为开的功能返回
    let datas = [];
    arr.forEach(val=>{
        if(val.sta) datas.push(val);
    })
    res.status(200).send({
        cloud: false,
        data: datas,
        code: 200
    })
})



// 获取采样器列表和模型列表
app.get('/getSampler', async (req, res) => {
    let samplerList = [
        {id: 6, name: "unipc", desc: "目前最快最新的采样方法，10步内就可以生成高质量结果，推荐步数区间5-10。"},
        {id: 1, name: "ddim", desc: "适合宽画，速度偏低，高step表现好，负面tag不够时发挥随意，环境光线与水汽效果好，写实不佳，推荐步数区间10-15。"},
        {id: 4, name: "euler", desc: "柔和 适合插画，环境细节与渲染好，背景模糊较深，推荐步数区间20-30。"},
        {id: 5, name: "euler_a", desc: "适合插画，关键词利用率仅次于dpm_2a，环境光效表现逊色，构图有时很奇葩，推荐步数区间30-40。"},
        {id: 2, name: "dpm_2a", desc: "对关键词的利用率最高，几乎占80％以上。"},
        {id: 3, name: "dpm++ sde", desc: "dpm++的SDE版本。"},
    ]
    let modalList = [
        {id: 1, name: "Stable Diffusion 1.5", modal: "8b1b897c-d66d-45a6-b8d7-8e32421d02cf", desc: 'id1'},
        {id: 2, name: "Stable Diffusion 2.1", modal: "ee88d150-4259-4b77-9d0f-090abe29f650", desc: 'id1'},
        {id: 3, name: "OpenJourney v4",       modal: "1e7737d7-545e-469f-857f-e4b46eaa151d", desc: 'id3'},
        {id: 4, name: "OpenJourney v2",       modal: "d66b1686-5e5d-43b2-a2e7-d295d679917c", desc: 'id4'},
        {id: 5, name: "OpenJourney v1",       modal: "7575ea52-3d4f-400f-9ded-09f7b1b1a5b8", desc: 'id4'},
        {id: 6, name: "Stable Diffusion(现代迪士尼风格)",        modal: "8ead1e66-5722-4ff6-a13f-b5212f575321", desc: 'id6'},
        {id: 7, name: "Stable Diffusion(未来科幻主题)",     modal: "1285ded4-b11b-4993-a491-d87cdfe6310c", desc: 'id7'},
        {id: 8, name: "Realistic Vision v4.0",modal: "37d42ae9-5f5f-4399-b60b-014d35e762a5	", desc: 'id8'},
        {id: 9, name: "Realistic Vision v2.0",modal: "eab32df0-de26-4b83-a908-a83f3015e971", desc: 'id8'},
        {id: 10, name: "SDXL",modal: "26a1a203-3a46-42cb-8cfa-f4de075907d8", desc: 'id9'},
    ]
    res.status(200).send({
        data: {
            sampler: samplerList,
            modal: modalList
        },
        code: 200
    })
})

import { getContent } from "./content.js";
// 获取模型说明
app.get('/getModalDesc', async (req, res) => {
    const descid = req.query.descid;
    const data = getContent(descid);
    res.status(200).send({
        data,
        code: 200
    })
})


// 获取推荐关键词
app.get('/promptExample', async (req, res) => {
    // 此处填入功能列表
    let arr = [
        {id: 11,name: "黏土风格的房子", sta: true, prompt: "A clay style icon depicting a house, with soft edges and muted colors, conveying a warm and cozy feeling, high resolution, detailed and tactile", negativePrompt: "(deformed iris, deformed pupils, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, anime:1.4), text, close up, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck",promptStrength: 7,sampler: "euler_a", steps: 50, modalId: "eab32df0-de26-4b83-a908-a83f3015e971",width: 512,height: 512,seed: 3414936602},
        {id: 10,name: "花瓶中的花", sta: true, prompt: "gently pink peonies in a vase, still life, by Albert Williams", negativePrompt: "",promptStrength: 7,sampler: "euler_a", steps: 24, modalId: "8b1b897c-d66d-45a6-b8d7-8e32421d02cf",width: 512,height: 704},
        {id: 9, name: "写实派画像", sta: true, prompt: "RAW photo, a close up portrait photo of 26 y.o woman in wastelander clothes, long haircut, pale skin, slim body, background is city ruins, (high detailed skin:1.2), 8k uhd, dslr, soft lighting, high quality, film grain, Fujifilm XT3", negativePrompt: "(deformed iris, deformed pupils, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, anime:1.4), text, close up, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, fringe",promptStrength: 6.07,sampler: "euler", steps: 25, modalId: "eab32df0-de26-4b83-a908-a83f3015e971",width: 512,height: 512},
        {id: 8, name: "卡通风格的猫咪", sta: true, prompt: "cat under a rock, dark, moody, concept art by alphonse mucha and greg rutkowski", negativePrompt: "asymmetric, watermarks",modalId: "ee88d150-4259-4b77-9d0f-090abe29f650",sampler: "ddim"},
        {id: 3, name: "森林中的房子", sta: true, prompt: "futuristic tree house, hyper realistic, epic composition, cinematic, landscape vista photography by Carr Clifton & Galen Rowell, Landscape veduta photo by Dustin Lefevre & tdraw, detailed landscape painting by Ivan Shishkin, rendered in Enscape, Miyazaki, Nausicaa Ghibli, 4k detailed post processing, unreal engine", negativePrompt: ""},
        {id: 5, name: "未来派瀑布", sta: true, prompt: "futuristic waterfalls, pink and light blue water, hyper realistic, epic composition, cinematic, landscape vista photography by Carr Clifton & Galen Rowell, Landscape veduta photo by Dustin Lefevre & tdraw, detailed landscape painting by Ivan Shishkin, rendered in Enscape, Miyazaki, Nausicaa Ghibli, 4k detailed post processing, unreal engine", negativePrompt: ""},
        {id: 1, name: "宠物狗水彩画", sta: true, prompt: "a watercolor painting of @myDog a dog, watercolor,art station trends, unusually unique beauty, discord profile picture, imaginfx, stunning design, transparent labs, full body dramatic profile, dj, canvas art, lord of beasts, featured on artsation, very detailed design, concrete art style", negativePrompt: ""},
        {id: 4, name: "未来城市", sta: true, prompt: "futuristic nighttime cyberpunk New York City skyline landscape vista photography by Carr Clifton & Galen Rowell, 16K resolution, Landscape veduta photo by Dustin Lefevre & tdraw, 8k resolution, detailed landscape painting by Ivan Shishkin, DeviantArt, Flickr, rendered in Enscape, Miyazaki, Nausicaa Ghibli, Breath of The Wild, 4k detailed post processing, atmospheric, hyper realistic, 8k, epic composition, cinematic, artstation —ar 16:9", negativePrompt: ""},
        {id: 2, name: "带着皇冠的宠物狗", sta: true, prompt: "a painting of @myDog a dog wearing a crown, hearts of iron portrait style, pablo hurtado de mendoza, looks like jerma985, presidental elections candidates, ornate portrait, gigachad portrait, duke 3 d, rasta, ed", negativePrompt: ""},
        {id: 6, name: "人物证件照", sta: true, prompt: "8k linkedin professional profile photo of @me in a suit with studio lighting, bokeh, corporate portrait headshot photograph best corporate photography photo winner, meticulous detail, hyperrealistic, centered uncropped symmetrical beautiful", negativePrompt: "out of frame, lowres, text, error, cropped, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, out of frame, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, username, watermark, signature"},
        {id: 7, name: "人物头像", sta: true, prompt: "portrait of @me man in the garden, beautiful face, intricate, tone mapped, ambient lighting, clouds, green leafs foreground, parrots, highly detailed, digital painting, concept art, sharp focus, by makoto shinkai and akihiko yoshida and hidari and wlo", negativePrompt: "out of frame, lowres, text, error, cropped, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, out of frame, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, username, watermark, signature"},
	]
    // 筛选状态为开的功能返回
    let datas = [];
    arr.forEach(val=>{
        if(val.sta) datas.push(val);
    })
    res.status(200).send({
        data: datas,
        code: 200
    })
})



// 创建项目,返回api-key
app.get('/createProfile', async (req, res) => {
    const names = req.query.names || '';
    const config = {
        method: 'post',
        url: 'https://www.tryleap.ai/api/create-project',
        headers: {
           'Content-Type': 'application/json',
           'Accept': '*/*',
           'Connection': 'keep-alive'
        },
        data: JSON.stringify({
            "projectName": names,
            userId
         })
     };
     
    axios(config).then(function (response) {
        // console.log(JSON.stringify(response.data));
        const datas = response.data.data.data;
        // console.log('id',datas['update_workspace_by_pk'].id)
        retoken().then(k=>{
            getApiKey(datas['update_workspace_by_pk']['id'],k).then(thekey=>{
                // console.log('----key',thekey)
                res.status(200).send({
                    data: thekey,
                    code: 200
                })
    
            }).catch(function (error) {
                console.log(error);
                res.status(500).send({err: error})
            });;
        }).catch(function (error) {
            console.log(error);
            res.status(500).send({err: error})
        });
    }).catch(function (error) {
        console.log(error);
        res.status(500).send({err: error})
    });
})


// 获取所有项目列表
app.get('/getProjects', async (req, res) => {
    const id = req.query.id || '';
    retoken().then(k=>{
        const config = {
            method: 'post',
            url: 'https://n.tryleap.ai/v1/graphql',
            headers: {
               'Content-Type': 'application/json',
               'Accept': '*/*',
               'Connection': 'keep-alive',
               'authorization': 'Bearer ' + k
            },
            data: JSON.stringify({
                "operationName": "GetAllProjects",
                "query": `query GetAllProjects {
                    workspace(where: {isArchived: {_eq: false}}) {
                      id
                      name
                      isArchived
                      createdAt
                      isPaid,
                      stripeCustomerId
                      stripeSubscriptionId
                      stripeSubscriptionItemIdImagesGenerated
                      stripeSubscriptionItemIdModelsTrained
                      __typename
                    }
                }`,
                "variables": {},
            })
         };
         
        axios(config).then(function (response) {
            // console.log(JSON.stringify(response.data));
            const datas = response.data.data.workspace;
            res.status(200).send({
                data: datas,
                code: 200
            })
        }).catch(function (error) {
            console.log(error);
            res.status(500).send({err: error})
        });  
    }).catch(err=>{
        res.status(500).send({err})
    })
})

// https://www.tryleap.ai/api/usage?workspaceId=db0d62bf-29fe-48fc-bd51-46ac2f0fffcd 查看项目剩余额度

// 获取项目KEY
app.get('/getPkey', async (req, res) => {
    const id = req.query.id || '';
    retoken().then(k=>{
        const config = {
            method: 'post',
            url: 'https://n.tryleap.ai/v1/graphql',
            headers: {
               'Content-Type': 'application/json',
               'Accept': '*/*',
               'Connection': 'keep-alive',
               'authorization': 'Bearer ' + k
            },
            data: JSON.stringify({
                "operationName": "GetSystemApiKey",
                "query": `query GetSystemApiKey($workspaceId: uuid = "") {
                    api_key(
                      where: {_and: {workspaceId: {_eq: $workspaceId}, isSystemKey: {_eq: true}}}
                    ) {
                      id
                      isSystemKey
                      workspaceId
                      createdAt
                      __typename
                    }
                }`,
                "variables": {
                    "workspaceId": id
                },
            })
         };
         
        axios(config).then(function (response) {
            // console.log(JSON.stringify(response.data));
            const datas = response.data;
            // const datas = response.data.data.api_key[0];
            res.status(200).send({
                data: datas,
                code: 200
            })
        }).catch(function (error) {
            console.log(error);
            res.status(500).send({err: error})
        });  
    }).catch(err=>{
        res.status(500).send({err})
    })
})



// 删除图像
app.get('/deleteLeap', async (req, res) => {
    const id = req.query.id || '';
	const tkey = req.query.key || API_KEY;
    const url = `${BASE_URL}/images/models/${MODEL_ID}/inferences/${id}`;

    axios({
        url,
        method: 'delete',
        headers: {
            authorization: 'Bearer ' + tkey
        }
    }).then(response => {
        // console.log(response)
        if(response.status == 200) {
            res.status(200).send({
                data: 'ok',
                code: 200
            })
        } else {
            res.status(500).send({
                err: "error"
            })
        }
    }).catch(err=>{
        res.status(500).send({err})
    })
})



// 获取单个图像
app.get('/getLeap', async (req, res) => {
    const id = req.query.id || '';
	const tkey = req.query.key || API_KEY;
    const url = `${BASE_URL}/images/models/${MODEL_ID}/inferences/${id}`;
    const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: 'Bearer ' + tkey
        }
    };
    if(!id) {
        res.status(500).send({err: "inferenceId 不能为空"});
    } else {
        fetch(url, options)
        .then(res => res.json())
        .then(json => {
            // console.log(json)
			json['key'] = tkey;
            res.status(200).send({
                data: json,
            })
        })
        .catch(err => {
            console.error('error:' + err)
            res.status(500).send({err})
        });
    }
})



// 获取全部图像
app.get('/getAllLeap', async (req, res) => {
    const { page=1, pageSize=100 } = req.query;
	const tkey = req.query.key || API_KEY;
    const url = `${BASE_URL}/images/models/${MODEL_ID}/inferences?page=${page}&pageSize=${pageSize}`;
    const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: 'Bearer ' + tkey
        }
    };
    fetch(url, options).then(
        res => res.json()
    ).then(json => {
        // console.log(json)
        res.status(200).send({
            data: json,
        })
    }).catch(err => {
        console.error('error:' + err)
        res.status(500).send({err})
    });
})



// POST请求
app.post('/', async(req, res) => {
    try {
        const body = req.body;
        res.status(200).send({ body })
    } catch (error) {
        console.log(error);
        
    }
})



/* 
创建图像
@param{
    prompt: "用于推理的提示",
    negativePrompt: "用于推理的负面提示(排除的项)",
    version: "用于推理的模型版本。如果未提供，将默认为最新版本。",
    steps: "用于推理的步骤数",
    width: "用于推理的图像的宽度。必须是 8 的倍数, 默认512"，
    height: "用于推理的图像的高度。必须是 8 的倍数, 默认512",
    numberOfImages: "生成的图像数量",
    seed: "用于推理的种子。必须是正整数",
    restoreFaces: "（可选）对生成的图像应用人脸恢复。这将使面部图像看起来更逼真。",
    enhancePrompt: "（可选）自动增强提示以生成更好的结果",
    upscaleBy: "（可选）放大生成的图像。这将使图像看起来更逼真。默认值为 x1，表示不升级。最大值为 x4",
    promptStrength: "提示强度越高，生成的图像就越接近提示。必须介于 0 和 30 之间",
    sampler: "选择用于推理的采样器, 默认ddim"
}
*/
app.post('/createLeap', async(req, res) => {
    try {
        const {
            prompt,
            negativePrompt,
            steps,
            width,
            height,
            numberOfImages,
            upscaleBy,
            restoreFaces,
            promptStrength,
            enhancePrompt,
        } = req.body;
        const tkey = req.body.apiKey || API_KEY;
        const sampler = req.body.sampler || 'euler_a';
        const seed = req.body.seed || false;
        
        let modalId = req.body.modalId ? req.body.modalId : MODEL_ID;

        const url = `${BASE_URL}/images/models/${modalId}/inferences`;

        let data = {
            prompt,
            negativePrompt: negativePrompt ? negativePrompt : '',
            steps,
            width,
            height,
            numberOfImages,
            promptStrength,
            restoreFaces,
            enhancePrompt,
            upscaleBy: upscaleBy ? 'x'+upscaleBy : 'x1',
            sampler: sampler
        };
        if(seed) {
            data.seed = seed*1
        };

        const options = {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'authorization': 'Bearer ' + tkey
            },
            body: JSON.stringify(data)
        };
        if(!prompt) {
            res.status(500).send({err: "prompt 不能为空"});
        } else {
            fetch(url, options)
            .then(res => res.json())
            .then(json => {
                console.log('创建',tkey,json)
                if(json.statusCode == 402 || json.statusCode == 401) {
                    let tnames = Math.random().toString(36).slice(-8);
                    createKey(tnames).then(tkeys=>{
                        console.log('额度不足，创建新项目',tnames,'|',tkeys);
                        API_KEY = tkeys;
                        writeFile(tkeys,tnames);
                    })
                    // 余额不足
                    res.status(402).send({
                        data: json,
                    })
                } else {
					json['key'] = tkey;
                    res.status(200).send({
                        data: json,
                    })
                }
            })
            .catch(err => {
                console.error('error:' + err)
                res.status(500).send({err})
            });
        }
    } catch (error) {
        res.status(500).send({err: error})
    }
})


// 创建项目,返回api-key
function createKey(names) {
    console.log(names)
    return new Promise((resolve,reject)=>{
        const config = {
            method: 'post',
            url: 'https://www.tryleap.ai/api/create-project',
            headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Connection': 'keep-alive'
            },
            data: JSON.stringify({
                "projectName": names,
                userId
            })
        };
        
        axios(config).then((response)=> {
            console.log('create-project',JSON.stringify(response.data));
            const datas = response.data.data.data;
            // console.log('id',datas['update_workspace_by_pk'].id)
            retoken().then(k=>{
                getApiKey(datas['update_workspace_by_pk']['id'],k).then(thekey=>{
                    console.log('----key',thekey)
                    resolve(thekey);
                }).catch(function (error) {
                    reject(error);
                });
            }).catch(function (error) {
                reject(error);
            });
        }).catch(function (error) {
            reject(error);
        });
    })
}


// 刷新token
function retoken() {
    return new Promise((resolve, rejects)=>{
        const config = {
            method: 'post',
            url: 'https://n.tryleap.ai/v1/auth/token',
            headers: {
               'Content-Type': 'application/json',
               'Accept': '*/*',
               'Connection': 'keep-alive',
            },
            data: JSON.stringify({
                refreshToken
            })
        };
        axios(config).then(function (response) {
            console.log('!!retoken success',response.data)
            const datas = response.data.accessToken;
            resolve(datas);
        }).catch(function (error) {
            console.log(error)
            rejects(error);
        });
    })
}
// 获取key
function getApiKey (id, key) {
    // console.log('接收',id)
    return new Promise((resolve, rejects)=>{
        const config = {
            method: 'post',
            url: 'https://n.tryleap.ai/v1/graphql',
            headers: {
               'Content-Type': 'application/json',
               'Accept': '*/*',
               'Connection': 'keep-alive',
               'authorization': 'Bearer ' + key
            },
            data: JSON.stringify({
                "operationName": "GetSystemApiKey",
                "query": "query GetSystemApiKey($workspaceId: uuid = \"\") {\n  api_key(\n    where: {_and: {workspaceId: {_eq: $workspaceId}, isSystemKey: {_eq: true}}}\n  ) {\n    id\n    isSystemKey\n    workspaceId\n    createdAt\n    __typename\n  }\n}\n",
                "variables": {
                    "workspaceId": id
                },
            })
        };
        axios(config).then(function (response) {
            // console.log('!!success',response.data)
            const datas = response.data.data.api_key[0];
            resolve(datas['id']);
        }).catch(function (error) {
            console.log(error)
            rejects(error);
        });
    })
}



/* keepalive  begin */
function keepalive() {
    // 1.请求主页，保持唤醒
    axios({
        url: render_app_url,
        method: 'get'
    }).then(res=>{

    }).catch(err=>{

    })
    // 1.请求去水印服务
    axios({
        url: render_app_url1,
        method: 'get'
    }).then(res=>{

    }).catch(err=>{
        
    })
    
    // 1.请求去水印服务
    axios({
        url: render_app_url2,
        method: 'get'
    }).then(res=>{

    }).catch(err=>{
        
    })
  
    //2. 本地进程检测,保活
    exec("ps -ef", function (err, stdout, stderr) {
      if (err) {
        console.log("保活本地进程检测-命令行执行失败:" + err);
      } else {
        // console.log("保活本地进程检测正在运行 stdout", stdout);
        if (stdout.includes("node index.js"))
            console.log("保活index.js-本地进程检测-index.js正在运行");
        //命令调起web.js
        else startWeb();
      }
    });
}
  
//保活频率设置为58秒
 setInterval(keepalive, 50 * 1000);
/* keepalive  end */
function startWeb() {
    let startWebCMD = "chmod +x ./index.js && ./index.js >/dev/null 2>&1 &";
    // let startWebCMD = "node index.js";
    exec(startWebCMD, function (err, stdout, stderr) {
      if (err) {
        console.log("启动index.js-失败:" + err);
      } else {
        console.log("启动index.js-成功!");
      }
    });
}

const port = process.env.PORT || 3000
const host = process.env.HOST || ''

app.server = app.listen(port, host, () => {
  console.log(`server running on http://${host ? host : 'localhost'}:${port}`)
})
export default app;
