import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(join(__dirname, 'public')));

// Gemini AI - .env에서 API 키 사용
function getModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY가 .env에 설정되어 있지 않습니다.');
  }
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

// ============================================
// 최적화된 시스템 프롬프트 (딥 리서치 기반)
// ============================================
const SYSTEM_PROMPT = `You are the world's most accomplished AI video generation prompt engineer, specializing in crafting prompts for Google Veo, Google Flow, Runway Gen-3, and Sora.

Your mission: Transform the user's Korean-language input into an ELITE-LEVEL English video generation prompt that produces stunning, cinematic results.

## YOUR EXPERTISE INCLUDES:
- Professional cinematography (camera angles, lens choices, depth of field)
- Film lighting techniques (Rembrandt, rim light, volumetric, practical)
- Color science and grading (LUT-style color descriptions)
- Film stock aesthetics (35mm grain, CineStill 800T, Kodak Vision3)
- Physical micro-details that make scenes feel alive
- Temporal pacing and motion design
- Knowledge of professional cinema cameras: ARRI Alexa 35 (natural skin tones, wide dynamic range), RED Komodo (6K, compressed RAW), Sony Venice 2 (dual ISO, full-frame)
- Anamorphic lens characteristics: Panavision C-series (warm, vintage flares), Cooke Anamorphic/i (creamy bokeh, gentle barrel distortion), Atlas Orion (modern, clean flare)
- Color science: ARRI LogC4 to Rec.709 conversion feel, REDWideGamutRGB to DCI-P3

## PROMPT CONSTRUCTION RULES:

1. **Structure**: Follow the SASM framework strictly:
   [Shot Type/Framing] → [Subject with detailed appearance] → [Action with micro-movements] → [Environment with atmosphere] → [Camera Movement] → [Lighting] → [Color Grade] → [Film Stock/Texture] → [Mood] → [Audio cues if applicable]

2. **Subject Consistency with Reference Images**: 
   - If reference images are provided (주인공 사진, 대상 인물 사진, 장소 사진), DO NOT invent or describe the character's physical appearance or the location in detail.
   - Instead, say "the person shown in the reference image" or "the woman/man from the reference photo" and focus on their ACTION, POSE, EXPRESSION, and CLOTHING MOVEMENT.
   - For locations, say "the location shown in the reference image" and focus on ATMOSPHERE, LIGHTING, and MOOD rather than describing the place.
   - This is CRITICAL because the user will upload these reference images directly to the video AI tool, and detailed text descriptions may CONFLICT with the visual reference.
   - If NO reference images are provided, then describe the character's physical appearance with EXTREME specificity as before.

3. **Micro-Actions**: Add subtle physical details that make the scene alive:
   - "hair gently swaying in the breeze"
   - "subtle chest rise with breathing"  
   - "light reflecting off moist lips"
   - "fabric creasing with movement"

4. **Cinematic Lighting**: Never use generic "cinematic lighting." Instead specify:
   - Light source and direction (e.g., "warm key light from upper left")
   - Shadow quality (e.g., "soft diffused shadows")
   - Atmospheric effects (e.g., "volumetric light rays cutting through haze")

5. **Color Grade as Natural-Language LUT**:
   Format: "Color grade: [Style] – shadows [color], midtones [color], highlights [color], contrast [level]"
   Example: "Color grade: Modern Cinematic – shadows deep teal, midtones warm amber, highlights creamy white, medium-high contrast"

6. **Film Stock & Texture**: Add organic texture:
   - "subtle 35mm film grain"
   - "gentle halation around bright light sources"
   - "natural lens vignette"

7. **Physics & Environment**: Ground the scene in reality:
   - "raindrops catching neon reflections on wet asphalt"
   - "steam rising from a coffee cup in cold air"
   - "dust particles floating in volumetric light beams"

8. **Negative Elements**: ALWAYS include these in the negative prompt:
   "no text, no subtitles, no captions, no titles, no watermarks, no logos" 
   Plus: "Avoid: morphing, digital artifacts, flickering, cartoonish proportions, overly sharp edges"
   This is MANDATORY for every single prompt. The user never wants any text/subtitles in their videos.

## IMPORTANT NOTE:
- The user's input will be in **Korean**. You MUST correctly understand Korean and translate all concepts into proper English cinematography terminology.
- ALL option values from the form are in Korean. Translate them to their proper English equivalents in the prompt.

## OUTPUT FORMAT:

You MUST output in this EXACT format (no deviation):

---ENGLISH_PROMPT_START---
[The complete English video prompt here - this should be a single, flowing paragraph that reads like a director's shot description]
---ENGLISH_PROMPT_END---

---KOREAN_PROMPT_START---
[위 영문 프롬프트를 한국어로 자연스럽게 번역. 영상의 장면을 한글로 읽었을 때 어떤 영상인지 바로 이해할 수 있도록 서술. 전문 용어는 괄호 안에 영어 원문 병기]
---KOREAN_PROMPT_END---

---KOREAN_EXPLANATION_START---
[한글 해설: 프롬프트에 사용된 주요 기법과 키워드를 설명. 왜 이런 키워드를 선택했는지, 어떤 효과를 기대할 수 있는지 간략히 설명]
---KOREAN_EXPLANATION_END---

---NEGATIVE_PROMPT_START---
[Negative prompt: elements to avoid, comma-separated in English. MUST ALWAYS include: no text, no subtitles, no captions, no titles, no watermarks]
---NEGATIVE_PROMPT_END---

## CRITICAL RULES:
- Output ONLY the formatted result. No greetings, no explanations outside the format.
- The English prompt must be ONE coherent paragraph, 100-200 words.
- The Korean prompt (한글 프롬프트) must be a FAITHFUL TRANSLATION of the English prompt, maintaining the same structure and detail level.
- Front-load the most important visual elements (AI models weigh the beginning more heavily).
- Use POSITIVE language only in the main prompt (describe what you WANT, not what you don't want).
- The Korean explanation should be 3-5 bullet points, helpful and educational.
- ALWAYS generate a negative prompt that includes "no text, no subtitles, no captions" - this is NON-NEGOTIABLE.`;

// ============================================
// API 엔드포인트
// ============================================
app.post('/api/generate', async (req, res) => {
  try {
    const model = getModel();

    const {
      character,
      action,
      background,
      style,
      shotType,
      cameraMove,
      lens,
      lighting,
      filmStock,
      colorGrade,
      mood,
      aspectRatio,
      negativeInput,
      audioInput,
      additionalNotes,
      images,
      sequenceMode,
      previousPrompt,
      sceneNumber
    } = req.body;

    if (!character || !action) {
      return res.status(400).json({ error: '인물과 행동은 필수 입력입니다.' });
    }

    // 첨부된 이미지 확인
    const hasMainChar = images && images.mainChar;
    const hasTargetChar = images && images.targetChar;
    const hasLocation = images && images.location;
    const hasAnyImages = hasMainChar || hasTargetChar || hasLocation;

    // 이미지 첨부 상황을 텍스트에 반영
    let imageContext = '';
    if (hasAnyImages) {
      imageContext = '\n[첨부된 참조 이미지]\n';
      if (hasMainChar) imageContext += '- 주인공 사진이 첨부되었습니다. 이 사진의 인물 외모를 프롬프트에서 직접 묘사하지 말고, "the person/woman/man shown in the reference image"로 지칭하세요.\n';
      if (hasTargetChar) imageContext += '- 대상 인물 사진이 첨부되었습니다. 이 사진의 인물도 외모를 묘사하지 말고 사진을 참고하도록 하세요.\n';
      if (hasLocation) imageContext += '- 장소 사진이 첨부되었습니다. 이 사진의 장소를 묘사하지 말고, "in the location shown in the reference image"로 표현하세요.\n';
      imageContext += '⚠️ 중요: 첨부된 사진의 인물/장소 외모를 텍스트로 묘사하면 영상 AI에서 충돌이 발생합니다. 반드시 사진 참조만 하세요.\n';
    }

    // 사용자 입력을 구조화된 텍스트로 구성
    const userInput = `
[사용자 입력 정보]
- 인물: ${character}
- 행동 및 상황: ${action}
- 배경: ${background || '(자유롭게 설정)'}
- 영상 스타일: ${style || '시네마틱 리얼리즘'}
- 샷 타입: ${shotType || '(자동 선택)'}
- 카메라 무빙: ${cameraMove || '(자동 선택)'}
- 렌즈: ${lens || '(자동 선택)'}
- 조명: ${lighting || '(자동 선택)'}
- 필름 스톡: ${filmStock || '(자동 선택)'}
- 컬러 그레이드: ${colorGrade || '(자동 선택)'}
- 분위기: ${mood || '(자동 선택)'}
- 화면 비율: ${aspectRatio || '16:9'}
${negativeInput ? `- 피하고 싶은 요소: ${negativeInput}` : ''}
${audioInput ? `- 오디오/음향: ${audioInput}` : ''}
${additionalNotes ? `- 추가 지시사항: ${additionalNotes}` : ''}
${imageContext}
${sequenceMode && previousPrompt ? `
[🔗 시퀀스 모드 - 씬 #${sceneNumber}]
이전 씬의 프롬프트:
"${previousPrompt}"

⚠️ 시퀀스 규칙:
1. 이전 프롬프트의 캐릭터 묘사(외모, 의상, 체형, 머리스타일 등)를 100% 동일하게 유지하세요.
2. 카메라 스타일, 컬러 그레이드, 필름 스톡도 동일하게 유지하세요.
3. 달라지는 것은 행동, 장소, 감정, 카메라 앵글뿐입니다.
4. 프롬프트 시작 부분에 캐릭터 묘사를 이전과 정확히 같은 표현으로 반복하세요.
5. 연속된 영상처럼 자연스럽게 이어지도록 시간적 흐름을 고려하세요.
` : ''}
위 정보를 바탕으로 최고급 영상 생성 프롬프트를 작성해주세요.`;

    // 멀티모달 콘텐츠 구성 (텍스트 + 이미지)
    const parts = [{ text: userInput }];

    // 이미지 parts 추가
    if (hasMainChar) {
      parts.push({
        inlineData: {
          mimeType: images.mainChar.mimeType,
          data: images.mainChar.data
        }
      });
    }
    if (hasTargetChar) {
      parts.push({
        inlineData: {
          mimeType: images.targetChar.mimeType,
          data: images.targetChar.data
        }
      });
    }
    if (hasLocation) {
      parts.push({
        inlineData: {
          mimeType: images.location.mimeType,
          data: images.location.data
        }
      });
    }

    console.log(`📸 이미지 첨부: 주인공=${!!hasMainChar}, 대상=${!!hasTargetChar}, 장소=${!!hasLocation}`);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4096,
      }
    });

    const responseText = result.response.text();
    
    // 디버그: 원본 응답 로그
    console.log('=== Gemini Raw Response ===');
    console.log(responseText);
    console.log('=== End Raw Response ===');

    // 유연한 파싱 (Gemini가 마크다운 볼드, 공백 등을 추가할 수 있음)
    function extractSection(text, startTag, endTag) {
      // 방법 1: 정확한 매칭
      const exact = text.match(new RegExp(startTag + '([\\s\\S]*?)' + endTag));
      if (exact) return exact[1].trim();
      
      // 방법 2: 마크다운 볼드(**) 포함 매칭
      const bold = text.match(new RegExp(startTag.replace(/---/g, '\\*{0,2}-{2,3}\\*{0,2}') + '([\\s\\S]*?)' + endTag.replace(/---/g, '\\*{0,2}-{2,3}\\*{0,2}')));
      if (bold) return bold[1].trim();
      
      // 방법 3: 코드블록 안에 있을 수 있음
      const codeBlock = text.match(new RegExp('`' + startTag + '`([\\s\\S]*?)`' + endTag + '`'));
      if (codeBlock) return codeBlock[1].trim();
      
      return null;
    }

    let englishPrompt = extractSection(responseText, '---ENGLISH_PROMPT_START---', '---ENGLISH_PROMPT_END---');
    let koreanPrompt = extractSection(responseText, '---KOREAN_PROMPT_START---', '---KOREAN_PROMPT_END---');
    let koreanExplanation = extractSection(responseText, '---KOREAN_EXPLANATION_START---', '---KOREAN_EXPLANATION_END---');
    let negativePrompt = extractSection(responseText, '---NEGATIVE_PROMPT_START---', '---NEGATIVE_PROMPT_END---');

    // 폴백: 구분자를 못 찾았으면 텍스트를 직접 분석
    if (!englishPrompt && !koreanExplanation) {
      console.log('⚠️ 구조화된 파싱 실패, 폴백 파싱 시도...');
      
      // 영어/한글로 분리 시도
      const lines = responseText.split('\n');
      const engLines = [];
      const korPromptLines = [];
      const korLines = [];
      const negLines = [];
      let section = 'eng';
      
      for (const line of lines) {
        const cleanLine = line.replace(/\*/g, '').trim();
        if (cleanLine.includes('ENGLISH') || cleanLine.includes('영문')) { section = 'eng'; continue; }
        if (cleanLine.includes('KOREAN_PROMPT') || cleanLine.includes('한글 프롬프트')) { section = 'korPrompt'; continue; }
        if (cleanLine.includes('KOREAN') || cleanLine.includes('한글') || cleanLine.includes('해설')) { section = 'kor'; continue; }
        if (cleanLine.includes('NEGATIVE') || cleanLine.includes('부정') || cleanLine.includes('Negative')) { section = 'neg'; continue; }
        if (cleanLine.includes('---') && cleanLine.length < 40) continue;
        
        if (cleanLine) {
          if (section === 'eng') engLines.push(cleanLine);
          else if (section === 'korPrompt') korPromptLines.push(line.trim());
          else if (section === 'kor') korLines.push(line.trim());
          else if (section === 'neg') negLines.push(cleanLine);
        }
      }
      
      englishPrompt = engLines.join(' ') || responseText.trim();
      koreanPrompt = korPromptLines.join(' ') || '';
      koreanExplanation = korLines.join('\n') || '';
      negativePrompt = negLines.join(', ') || '';
    }

    // 최종 안전장치: 영어 프롬프트가 없으면 전체를 영어로
    if (!englishPrompt) englishPrompt = responseText.trim();

    console.log('✅ Parsed - EN:', englishPrompt.substring(0, 80) + '...');
    console.log('✅ Parsed - KR Prompt:', koreanPrompt ? koreanPrompt.substring(0, 80) + '...' : '(없음)');
    console.log('✅ Parsed - KR Explain:', koreanExplanation ? koreanExplanation.substring(0, 80) + '...' : '(없음)');
    console.log('✅ Parsed - NEG:', negativePrompt ? negativePrompt.substring(0, 80) + '...' : '(없음)');

    res.json({
      success: true,
      englishPrompt,
      koreanPrompt,
      koreanExplanation,
      negativePrompt,
      rawResponse: responseText
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      error: '프롬프트 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// ============================================
// 랜덤 영감 API
// ============================================
app.post('/api/random-inspiration', async (req, res) => {
  try {
    const model = getModel();
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: '영상 AI로 만들기에 아름답고 시네마틱한 장면 시나리오를 하나 제안해줘. 다양한 장르(로맨스, 액션, 판타지, 일상, 풍경, 뮤직비디오, 광고 등)에서 랜덤하게 골라서 제안해줘.' }] }],
      systemInstruction: { parts: [{ text: `너는 창의적인 영상 시나리오 작가야. 사용자에게 영상 AI로 만들기 좋은 멋진 장면 하나를 제안해줘.

반드시 아래 JSON 형식으로만 응답해. 다른 텍스트는 절대 포함하지 마:
{"character": "인물 설명 (외모, 옷차림 등)", "action": "상황 및 행동 (구체적인 동작, 표정)", "background": "배경 설명 (장소, 시간, 날씨, 분위기)"}

예시:
{"character": "30대 남성, 낡은 가죽 재킷에 청바지, 짧은 머리에 수염", "action": "옥상 난간에 기대어 서서 석양을 바라보며 담배 연기를 내뿜는다", "background": "서울 강남의 오래된 빌딩 옥상, 골든아워, 멀리 한강이 보이고 도시 스카이라인이 실루엣으로 보인다"}

매번 완전히 다른 장르와 분위기의 시나리오를 제안해줘. 한국적인 배경도 좋고 외국 배경도 좋아.` }] },
      generationConfig: { temperature: 1.2, topP: 0.95, maxOutputTokens: 500 }
    });

    const text = result.response.text().trim();
    console.log('🎲 Random Inspiration:', text);

    // JSON 파싱 시도
    let parsed;
    try {
      // 코드블록 안에 있을 수 있음
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (e) {
      parsed = { character: '', action: text, background: '' };
    }

    res.json({ success: true, ...parsed });
  } catch (error) {
    console.error('Random Inspiration Error:', error);
    res.status(500).json({ error: '영감 생성 실패', details: error.message });
  }
});

// ============================================
// 이미지 분석 API (Gemini Vision)
// ============================================
app.post('/api/analyze-image', async (req, res) => {
  try {
    const model = getModel();
    const { image, type } = req.body; // type: 'mainChar', 'targetChar', 'location'

    if (!image || !image.data) {
      return res.status(400).json({ error: '이미지가 필요합니다.' });
    }

    let analysisPrompt;
    if (type === 'location') {
      analysisPrompt = '이 장소 사진을 분석해서 영상 프롬프트에 쓸 수 있도록 한국어로 설명해줘. 장소의 특징, 분위기, 시간대, 날씨, 건축 양식, 주변 환경 등을 구체적으로 묘사해줘. 한 문장이 아니라 상세하게 3-4줄로 써줘. 순수한 묘사 텍스트만 출력해. 제목이나 머릿말 없이.';
    } else {
      analysisPrompt = '이 인물 사진을 분석해서 영상 프롬프트에 쓸 수 있도록 한국어로 설명해줘. 성별, 추정 나이대, 머리 스타일과 색상, 피부톤, 체형, 옷차림(색상, 소재, 스타일), 액세서리, 표정, 전체적인 분위기를 구체적으로 묘사해줘. 한 문장이 아니라 상세하게 3-4줄로 써줘. 순수한 묘사 텍스트만 출력해. 제목이나 머릿말 없이.';
    }

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: analysisPrompt },
          { inlineData: { mimeType: image.mimeType, data: image.data } }
        ]
      }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
    });

    const description = result.response.text().trim();
    console.log(`🔍 Image Analysis (${type}):`, description.substring(0, 100) + '...');

    res.json({ success: true, description, type });
  } catch (error) {
    console.error('Image Analysis Error:', error);
    res.status(500).json({ error: '이미지 분석 실패', details: error.message });
  }
});

// SPA 라우팅 - 모든 경로를 index.html로
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎬 AI 영상 프롬프트 메이커 서버 실행 중: http://localhost:${PORT}`);
});
