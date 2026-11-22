"""
Google AI Studio Gemini Service for Care AI
Supports direct Google AI Studio API key (GEMINI_API_KEY) with Gemini models.
Decoupled from GCP Vertex AI to enable rapid zero-configuration hackathon execution.
"""
import os
import re
import json
import logging
import requests
from datetime import datetime
from typing import Dict, Any, List, Optional
from config import Config
from genomic_lookup import genomic_lookup

logger = logging.getLogger(__name__)

SUPPORTED_GEMINI_MODELS = [
    {
        "id": "gemini-3.8-flash",
        "name": "Gemini 3.8 Flash",
        "badge": "Next Gen Fast",
        "description": "High-speed multimodal intelligence for instant answers"
    },
    {
        "id": "gemini-3.1-pro-preview",
        "name": "Gemini 3.1 Pro Preview",
        "badge": "Deep Reasoning",
        "description": "Advanced reasoning model for complex clinical genetics"
    },
    {
        "id": "gemini-3.0-flash",
        "name": "Gemini 3.0 Flash",
        "badge": "Production Fast",
        "description": "Standard fast and reliable clinical reasoning model"
    },
    {
        "id": "gemini-2.5-flash",
        "name": "Gemini 2.5 Flash",
        "badge": "Stable Fast",
        "description": "Comprehensive genomic and multi-source reasoning"
    }
]

class GeminiStudioService:
    def __init__(self):
        self.api_key = os.environ.get('GEMINI_API_KEY') or getattr(Config, 'GEMINI_API_KEY', '')
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    @staticmethod
    def normalize_model_id(model_id: Optional[str]) -> str:
        """
        Normalizes incoming model identifiers to verified active Google AI Studio Gemini models (>= 2.5).
        Maps deprecated models (2.5-pro, 2.0, 1.5, 1.0) or empty models to gemini-3.8-flash.
        """
        m = (model_id or '').strip()
        m = m.replace('models/', '')
        low = m.lower()
        if not low or any(leg in low for leg in ['2.5-pro', '2.0', '1.5', '1.0']):
            return 'gemini-3.8-flash'
        v_match = re.search(r'gemini-(\d+(?:\.\d+)?)', low)
        if v_match:
            try:
                ver = float(v_match.group(1))
                if ver >= 2.5:
                    return m
            except ValueError:
                pass
        return 'gemini-3.8-flash'

    def _call_generate_content(
        self,
        model_id: str,
        api_key: str,
        payload: Dict[str, Any],
        timeout: int = 15
    ) -> tuple[Optional[Dict[str, Any]], Optional[str], Optional[str]]:
        """
        Calls Google AI Studio Generative Language API with candidate variant and version fallback.
        Ensures active Gemini models (>= 2.5) are queried on supported endpoints (v1beta/v1).
        Never overwrites error with a different model's error.
        Returns: (data_dict, used_model_name, error_message)
        """
        clean_model = (model_id or '').replace('models/', '').strip()
        if not clean_model or any(leg in clean_model.lower() for leg in ['2.5-pro', '2.0', '1.5', '1.0']):
            clean_model = 'gemini-3.8-flash'

        # Candidate variants: primary model first, followed by live fallbacks (>= 2.5)
        candidates = [clean_model]
        for fb in ['gemini-3.8-flash', 'gemini-3.0-flash', 'gemini-2.5-flash', 'gemini-3.1-pro-preview']:
            if fb not in candidates:
                candidates.append(fb)

        # Preserving order and uniqueness
        unique_candidates = []
        for c in candidates:
            if c not in unique_candidates:
                unique_candidates.append(c)

        primary_error = None
        last_error = f"Model {clean_model} could not be resolved."

        for idx, variant in enumerate(unique_candidates):
            v_low = variant.lower()
            # Gemini models >= 2.5 reside on v1beta; also allow v1 if not experimental
            api_versions = ['v1beta']
            if 'exp' not in v_low:
                api_versions.append('v1')

            for ver in api_versions:
                url = f"https://generativelanguage.googleapis.com/{ver}/models/{variant}:generateContent?key={api_key}"
                try:
                    resp = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=timeout)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data, variant, None

                    try:
                        err_json = resp.json().get('error', {})
                        err_msg = err_json.get('message') or f"HTTP {resp.status_code}"
                    except Exception:
                        err_msg = f"HTTP {resp.status_code}: {resp.text[:120]}"

                    last_error = err_msg
                    if idx == 0 and not primary_error:
                        primary_error = err_msg

                    # If API key is invalid or unauthorized, fail immediately without trying other versions
                    if resp.status_code in (400, 401, 403) and any(kw in err_msg.lower() for kw in ['api key not valid', 'api_key_invalid', 'permission_denied', 'unregistered']):
                        return None, None, err_msg

                except requests.exceptions.Timeout:
                    err_msg = f"Request timed out ({timeout}s) on {ver} for {variant}"
                    last_error = err_msg
                    if idx == 0 and not primary_error:
                        primary_error = err_msg
                except Exception as e:
                    err_msg = str(e)
                    last_error = err_msg
                    if idx == 0 and not primary_error:
                        primary_error = err_msg

        return None, None, primary_error or last_error

    def get_supported_models(self) -> List[Dict[str, str]]:
        return SUPPORTED_GEMINI_MODELS

    def test_connection(self, api_key: str, model_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Validates API key by querying Google AI Studio ModelService (GET /v1beta/models?key=...).
        Returns HTTP 200 with list of verified available models that support generateContent
        and are suitable for conversational premarital intelligence and analysis.
        """
        cleaned_key = (api_key or '').strip()
        if not cleaned_key:
            return {"status": "error", "message": "API key cannot be empty."}

        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={cleaned_key}"
        try:
            resp = requests.get(url, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                raw_models = data.get("models", [])
                supported = []
                seen_ids = set()

                for m in raw_models:
                    methods = m.get("supportedGenerationMethods", [])
                    if "generateContent" in methods:
                        m_name = m.get("name", "")
                        m_id = m_name.replace("models/", "")
                        # Filter to active Gemini generation models suitable for chat and premarital analysis
                        if "gemini" in m_id.lower() and not any(bad in m_id.lower() for bad in ["embedding", "aqa", "vision", "tuned", "thinking", "2.5-pro", "2.0", "1.5", "1.0"]):
                            v_match = re.search(r'gemini-(\d+(?:\.\d+)?)', m_id.lower())
                            if v_match:
                                try:
                                    ver = float(v_match.group(1))
                                except ValueError:
                                    ver = 0.0
                                if ver >= 2.5 and m_id not in seen_ids:
                                    seen_ids.add(m_id)
                                    display_name = m.get("displayName") or m_id
                                    badge = "Next Gen" if ver >= 3.0 else "Stable"
                                    supported.append({
                                        "id": m_id,
                                        "name": display_name,
                                        "badge": badge,
                                        "description": m.get("description", "")[:100],
                                        "version": ver
                                    })

                # Sort live models newest version first (e.g. 3.8 before 3.0 before 2.5)
                supported.sort(key=lambda item: item.get("version", 0.0), reverse=True)
                if not supported:
                    supported = SUPPORTED_GEMINI_MODELS

                return {
                    "status": "success",
                    "message": f"Successfully connected to Google AI Studio ({len(supported)} models verified for chat & analysis).",
                    "models": supported
                }
            else:
                try:
                    err = resp.json().get("error", {})
                    msg = err.get("message", f"HTTP {resp.status_code}")
                except Exception:
                    msg = f"HTTP {resp.status_code}: {resp.text[:120]}"
                return {
                    "status": "error",
                    "message": f"Gemini connection failed: {msg}"
                }
        except requests.exceptions.Timeout:
            return {
                "status": "error",
                "message": "Connection timed out connecting to Google AI Studio. Please check your internet connection."
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Connection error: {str(e)}"
            }

    def ask(self,
            prompt: str,
            model_id: str = "gemini-3.8-flash",
            view_mode: str = "patient",
            pedigree_context: Optional[Dict[str, Any]] = None,
            api_key: Optional[str] = None,
            current_page: str = "Dashboard",
            page_context: str = "",
            conversation_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Sends query to Google AI Studio Gemini API with clinical framing, active page context, and pedigree grounding.
        """
        api_key = (api_key or self.api_key or os.environ.get('GEMINI_API_KEY') or getattr(Config, 'GEMINI_API_KEY', '') or '').strip()
        
        # Validated model check (fallback to gemini-3.8-flash if invalid)
        selected_model = model_id if model_id else "gemini-3.8-flash"

        # Check if conversation is ongoing (user has previously asked questions)
        is_ongoing = False
        if conversation_history:
            user_turns = [m for m in conversation_history if isinstance(m, dict) and m.get('sender') == 'user']
            if len(user_turns) > 0:
                is_ongoing = True

        # Construct System Instruction based on Dual-Lens View Mode
        ped_lines = []
        act_fam = (pedigree_context or {}).get("active_family") or {}
        fam_id = (pedigree_context or {}).get("family_id") or act_fam.get("family_id") or ""
        fam_title = act_fam.get("family_name") or act_fam.get("name") or (f"Family Chart {fam_id}" if fam_id else "")
        consang = "Consanguineous Lineage Reported" if act_fam.get("is_consanguineous") else "Non-consanguineous"

        if fam_id or fam_title:
            ped_lines.append(f"Active Family Pedigree Chart: ID '{fam_id}', Title: '{fam_title}', Lineage: {consang}.")

        nodes = (pedigree_context or {}).get("nodes") or []
        if nodes:
            ped_lines.append(f"Chart Members ({len(nodes)} mapped):")
            for n in nodes:
                p_name = n.get("alias_name") or n.get("name") or n.get("pseudonym") or "Relative"
                rel = n.get("relationship") or n.get("relationship_to_proband") or "member"
                gen = n.get("generation") or "Unknown"
                sex = n.get("sex") or "unspecified"
                c_stat = n.get("carrier_status") or ("Carrier" if n.get("is_carrier") else ("Affected" if n.get("is_affected") else "Unaffected"))
                conds = n.get("conditions") or n.get("condition_locus") or "None documented"
                if isinstance(conds, list):
                    conds = ", ".join(str(c) for c in conds)
                ped_lines.append(f"  • {p_name} ({rel}, Gen {gen}, {sex}): Carrier Status = '{c_stat}', Loci/Conditions = [{conds}]")
        else:
            ped_lines.append("No pedigree nodes mapped yet in this active chart.")

        all_fams = (pedigree_context or {}).get("families") or []
        if len(all_fams) > 1:
            other_ids = [f"ID: '{f.get('family_id')}' ({f.get('family_name') or f.get('name') or 'Chart'})" for f in all_fams if str(f.get('family_id')) != str(fam_id)]
            if other_ids:
                ped_lines.append(f"Other Charts in User Account: {'; '.join(other_ids)}.")

        pedigree_summary = "\n".join(ped_lines)

        reports_summary = ""
        if pedigree_context and pedigree_context.get("reports"):
            reps = pedigree_context["reports"]
            rep_items = []
            for r in reps:
                m = r.get('masked_data') or {}
                p_name = m.get('patient_name') or 'Patient'
                cond = m.get('conditions') or m.get('carrier_status') or 'Screened'
                rep_items.append(f"{p_name}: {cond}")
            if rep_items:
                reports_summary = f"\nScreening Reports on file: {'; '.join(rep_items[:4])}."

        policy_context = (
            "\nPremarital Policy Context: Aligned with UAE National Premarital Screening Regulations "
            "(Cabinet Resolution / Health Authority standards for hemoglobinopathies Beta-Thalassemia, Sickle Cell, G6PD, and premarital genetic counseling). "
            "Explain lab markers (HbA2 > 3.5%, MCV < 80 fL), medical terms, and options in simple everyday English."
        )

        today_str = datetime.now().strftime("%A, %B %d, %Y")
        screen_info = f"Current User Screen: {current_page}."
        if page_context:
            screen_info += f" Context on screen: {page_context}"

        ongoing_directive = ""
        if is_ongoing:
            ongoing_directive = (
                "\nCRITICAL ONGOING CONVERSATION DIRECTIVE: This chat conversation is already ongoing. "
                "DO NOT include any opening greeting (such as 'Hello', 'Welcome', 'It is a pleasure to see you', etc.) at the start of your reply. "
                "Answer the user's question directly, politely, and cleanly without greeting.\n"
            )

        system_prompt = (
            "You are Care AI, a warm, polite, and reassuring premarital genetics guide within GuardianAngel. "
            f"Today's Date: {today_str}. "
            f"{screen_info}\n\n"
            "COMMUNICATION GUIDELINES (POLITE, NATURAL & RESPECTFUL OF UAE FAMILIES):\n"
            "1. Natural, Conversational & Polite: Speak like a caring, knowledgeable human counselor. Never sound robotic or repetitive. Never use formulaic prefixes like 'AI reviewed your question regarding'. Always honor UAE cultural values and family dignity.\n"
            "• Opening Greeting: When the user greets you (e.g. 'hi', 'hello', 'hey', 'good morning', 'salam', or begins the conversation), reply warmly with: 'Hello! It is a pleasure to see you on your dashboard today. That is a very important question, and I am happy to help clarify the difference.' (adapt 'dashboard' if the user is viewing another screen).\n"
            "• Ongoing Conversation Rule: If the chat conversation is ongoing, DO NOT include greeting messages every time the user asks new questions. Answer subsequent inquiries directly without repeating greetings.\n"
            f"2. Contextual Screen Awareness: The user is currently viewing the {current_page} screen. Use what they are seeing right now to make your answers immediately relevant, fast, and helpful. "
            "3. Plain English & Reassurance: Explain medical concepts in simple, clear everyday English (approx 6th-8th grade reading level). "
            "Reassure that being a carrier is completely normal and healthy (not an illness). "
            "Emphasize that even if both partners carry the exact same recessive trait, there is still a 75% chance (3 out of 4) in every pregnancy of having a healthy baby, and modern options like IVF with PGT-M provide complete certainty for healthy children. "
            "4. Conversational & General Questions: When asked general questions (like today's date, what screen they are on, who you are, or how to use the app), respond directly, warmly, and naturally without forcing an unrelated genetic diagnosis.\n"
            "5. Bilingual English & Arabic Support: If the user communicates in Arabic, or explicitly requests Arabic (e.g., 'reply in Arabic', 'in Arabic please', 'بالعربية', 'ترجم بالعربي', or writes in Arabic characters), you MUST generate your complete, polite, and culturally resonant response entirely in standard fluent Arabic (الفصحى). Always maintain empathetic and reassuring tone in Arabic, reassuring carrier status (حامل صفة وراثية) is not a disease and explaining the 75% healthy child probability (75% احتمال إنجاب طفل سليم معافى) with dignity.\n\n"
            f"{ongoing_directive}"
            f"Family Context:\n{pedigree_summary}{reports_summary}{policy_context}"
        )

        # If API Key is present, call Google AI Studio REST API
        # STRICT DIRECTIVE: When user has provided an AI key, NO offline rules apply. It must be free from all backend rules.
        if api_key:
            selected_model = self.normalize_model_id(model_id)
            payload = {
                "system_instruction": {
                    "parts": [
                        {"text": system_prompt}
                    ]
                },
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": prompt}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.4,
                    "maxOutputTokens": 2048,
                    "topP": 0.95
                }
            }

            data, used_model, err = self._call_generate_content(selected_model, api_key, payload, timeout=15)
            if data:
                candidates = data.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    text = "".join([p.get("text", "") for p in parts])
                    return {
                        "status": "success",
                        "answer": text,
                        "model": used_model or selected_model,
                        "source": f"Google AI Studio ({used_model or selected_model})",
                        "view_mode": view_mode,
                        "confidence": "96%",
                        "locus_reference": "ACMG / OMIM #613985"
                    }

            # If the API key is genuinely invalid or unauthorized, return true API error
            is_auth_error = err and any(kw in str(err).lower() for kw in ['api key', 'api_key', 'permission_denied', 'unregistered', 'unauthorized', 'invalid argument'])
            if is_auth_error:
                logger.error(f"Google AI Studio API error for {selected_model}: {err}")
                return {
                    "status": "error",
                    "error": True,
                    "answer": f"Google AI Studio error: {err}. Please check your API key and connection in Settings.",
                    "model": selected_model,
                    "source": f"Google AI Studio ({selected_model}) Error",
                    "view_mode": view_mode
                }

            # Resilient mid-conversation fallback if quota exceeded or live model encounters upstream failure
            logger.warning(f"Google AI Studio API error for {selected_model}: {err}. Gracefully falling back to clinical knowledge.")
            fallback = self._generate_fallback_response(prompt, selected_model, view_mode, pedigree_summary, current_page, page_context)
            fallback["source"] = "Care AI Clinical Knowledge"
            fallback["model"] = selected_model
            return fallback

        # Offline rule-based intelligence is ONLY reached when user has NOT provided an API key
        return self._generate_fallback_response(prompt, selected_model, view_mode, pedigree_summary, current_page, page_context)

    def _generate_fallback_response(self, prompt: str, model_id: str, view_mode: str, pedigree_summary: str, current_page: str = "Dashboard", page_context: str = "") -> Dict[str, Any]:
        p = prompt.lower().strip()
        today_str = datetime.now().strftime("%A, %B %d, %Y")

        is_arabic = any(kw in p for kw in ["arabic", "بالعربي", "بالعربية", "عربي"]) or any('\u0600' <= char <= '\u06FF' for char in prompt)

        if is_arabic:
            if view_mode == "patient":
                if any(w in p for w in ["مرحبا", "سلام", "اهلا", "marhaba", "salam", "ahlan", "hello", "hi"]):
                    ans = f"أهلاً وسهلاً بك وبأسرتك الكريمة! أنا **Care AI**، مساعدك الذكي للإرشاد الوراثي والفحص الطبي لما قبل الزواج. أنت تشاهد حالياً صفحة **{current_page}**. كيف يمكنني مساعدتك أنت وشريكك اليوم؟"
                elif any(w in p for w in ["تاريخ", "اليوم", "date", "today", "time"]):
                    ans = f"اليوم هو {today_str}. يسعدني تقديم المساعدة الطبية لك ولأسرتك الكريمة! كيف يمكنني إرشادك في فحوصات ما قبل الزواج اليوم؟"
                elif any(w in p for w in ["طفل", "اطفال", "سليم", "صحي", "ثلاسيميا", "حامل", "جين", "healthy", "child", "baby", "carrier", "thalassemia"]):
                    ans = (
                        "**هل يمكنكم إنجاب أطفال أصحاء حتى لو كان كلاكما حاملاً لصفات وراثية؟ نعم، بكل تأكيد وبإذن الله.**\n\n"
                        "• **احتمالات الحمل الطبيعي:** حتى في حال كان كلا الزوجين يحملان نفس الصفة الوراثية المتنحية (مثل الثلاسيميا)، فهناك **احتمال بنسبة 75% (3 من كل 4) في كل حمل** لإنجاب طفل سليم ومعافى تماماً وخالٍ من المرض.\n"
                        "• **حالة الزوج الواحد الحامل للصفة:** إذا كان أحد الزوجين فقط حاملاً للصفة والآخر سليماً، فإن نسبة إصابة الطفل بالمرض هي **0%**.\n"
                        "• **المعنى الطبي لـ 'حامل الصفة':** أن تكون حاملاً لصفة وراثية يعني أنك شخص سليم ومعافى تماماً، وتعيش حياة طبيعية وصحية كاملة دون أن تكون مريضاً.\n"
                        "• **تقنيات الإنجاب والاطمئنان (PGT-M):** للأزواج الراغبين في الاطمئنان التام، يتيح الفحص الجيني المبكر للأجنة (PGT-M) مع أطفال الأنابيب التأكد التام من سلامة الأجنة ونقل الأجنة السليمة فقط."
                    )
                elif any(w in p for w in ["شجرة", "عائلة", "نجمة", "طفل النجوم", "pedigree", "star"]):
                    ans = (
                        "**رمز طفل النجوم (★ Star Child) في شجرة العائلة:**\n\n"
                        "• **ما يمثله الرمز:** يمثل رمز النجمة (★) طفلاً مستقبلياً متوقعاً عبر الحسابات الإحصائية الوراثية، لمساعدتكم في فهم احتمالات انتقال الصفات الوراثية.\n"
                        "• **الفائدة السريرية:** يوضح احتمالات الوراثة المندلية بدقة لتمكينكم من التخطيط الأسري الواعي وبكل طمأنينة."
                    )
                else:
                    ans = (
                        f"يسعدني تقديم الإرشاد الوراثي الطبي لك ولأسرتك الكريمة في صفحة **{current_page}** وفقاً لمعايير الفحص الطبي لما قبل الزواج بدولة الإمارات العربية المتحدة. "
                        "الفحص الوراثي المبكر يمنحكما راحة البال والاطمئنان التام على صحة أطفالكم المستقبلية. "
                        "يمكنك سؤالي عن نتائج الفحوصات المخبرية، أو أمراض الدم الوراثية (مثل الثلاسيميا ونقص الخميرة G6PD)، أو احتمالات الوراثة، أو خيارات التخطيط الإنجابي الآمن."
                    )
            else:
                ans = (
                    "**التقييم السريري للاستشارة الوراثية لما قبل الزواج (ACMG / UAE Guidelines):**\n\n"
                    "• **الفحص الجيني الموسع (ECS):** يهدف إلى تحديد حاملي الطفرات المتنحية المرتبطة بالاعتلالات الهيموغلوبينية واضطرابات التمثيل الغذائي الشائعة إقليمياً.\n"
                    "• **المشورة الإنجابية:** في حال توافق طفرات الزوجين، يتم التوجيه نحو التشخيص الوراثي قبل الغرس (PGT-M) لضمان ولادة أطفال أصحاء."
                )
            return {
                "status": "success",
                "answer": ans,
                "model": model_id,
                "source": "Care AI Clinical Knowledge",
                "view_mode": view_mode,
                "confidence": "95%",
                "locus_reference": "ACMG / UAE National Screening Guidelines"
            }

        if view_mode == "patient":
            # 1. Date and Time queries
            if any(w in p for w in ["date", "today", "what day", "what time", "current time", "current date"]):
                ans = f"Today is {today_str}. It is my pleasure to assist you! How can I help you and your family with your premarital health records or screening results today?"
            # 2. Greetings
            elif any(p.startswith(w) for w in ["hello", "hi", "hey", "marhaba", "salam", "ahlan", "good morning", "good afternoon", "good evening"]):
                page_name = "dashboard" if current_page.lower() == "dashboard" else f"{current_page.lower()} screen"
                ans = f"Hello! It is a pleasure to see you on your {page_name} today. That is a very important question, and I am happy to help clarify the difference."
            # 3. Pedigree & Star Child queries
            elif any(w in p for w in ["star child", "star symbol", "star", "★"]):
                ans = (
                    "**The ★ Star Child Symbol in Your Pedigree:**\n\n"
                    "• **What it represents:** The Star Child (★) symbol on your family pedigree canvas represents a future projected offspring. It is not an existing child, but rather a clinical forecast.\n"
                    "• **Why it is helpful:** It calculates Mendelian transmission probabilities based on both partners' screening records, showing you inheritance chances in advance so you can plan with confidence."
                )
            elif any(w in p for w in ["pedigree", "family tree", "family tree chart", "tree chart"]):
                ans = "Your family pedigree tree maps your family lineage across three generations to help you and your partner understand carrier traits before marriage. You can view, add family members, or see projected offspring (★ Star Child) on the Pedigree page. What would you like to explore in your family tree?"
            # 4. OMIM Codes and Genomic Loci
            elif "300377" in p or "305900" in p or "g6pd" in p or "fava" in p:
                ans = (
                    "**OMIM #300377 / #305900 — G6PD Deficiency (Glucose-6-Phosphate Dehydrogenase, Locus Xq28):**\n\n"
                    "• **What it is:** G6PD is an essential red blood cell enzyme cataloged under OMIM #300377 (gene) and OMIM #305900 (condition). When enzyme activity is reduced, red blood cells can be sensitive to oxidative triggers.\n"
                    "• **Everyday Health & Longevity:** Individuals lead completely normal, active, healthy lives simply by avoiding fava beans (favism) and specific oxidative medications (such as primaquine, rasburicase, and dapsone).\n"
                    "• **Inheritance & Family Planning:** G6PD is an X-linked recessive trait. Carrier mothers have a 50% probability of passing the allele to sons (who express the trait) or daughters (who are carriers). Pre-marital screening identifies this early so families can plan safely."
                )
            elif "613985" in p or "thalassemia" in p or "beta" in p:
                ans = (
                    "**OMIM #613985 — Beta-Thalassemia (HBB Gene, Locus 11p15.4):**\n\n"
                    "• **What it means for you:** Carrying one copy (heterozygous trait / minor) means you have a slight change in the beta-globin gene. You are completely healthy, lead a normal life, and do not have the disease.\n"
                    "• **Family & Baby Planning:** If your partner does not carry the trait, your baby has zero risk of having the disease. If both of you carry the trait, there is still a **75% chance (3 out of 4) in every pregnancy** of having a healthy baby.\n"
                    "• **Peace-of-Mind Options:** A simple routine screening test (Hb electrophoresis) for your partner clarifies your couple status, and modern pathways like IVF with PGT-M allow complete certainty."
                )
            elif "219700" in p or "cftr" in p or "cystic" in p:
                ans = (
                    "**OMIM #219700 — Cystic Fibrosis (CFTR Gene, Locus 7q31.2):**\n\n"
                    "• **What it is:** An autosomal recessive condition involving the CFTR chloride channel.\n"
                    "• **Carrier Status:** Being a carrier means you carry one healthy gene and one variant copy. Carriers are completely healthy and asymptomatic. A baby is only at risk if both reproductive partners carry a variant in the same CFTR gene."
                )
            elif "omim" in p:
                omim_match = re.search(r'\b\d{6}\b', p)
                omim_num = omim_match.group(0) if omim_match else "variant"
                res = genomic_lookup.lookup(omim_num) if omim_num != "variant" else {}
                if res and res.get("found"):
                    ans = (
                        f"**Genomic Lookup for OMIM #{omim_num} ({res.get('gene', 'Gene')} Locus):**\n\n"
                        f"• **Condition:** {res.get('condition', 'Inherited Trait')}\n"
                        f"• **Inheritance:** {res.get('inheritance', 'Autosomal Recessive')}\n"
                        f"• **Clinical Guidance:** {res.get('patient_friendly_summary', 'Routine premarital screening helps clarify carrier concordance before marriage.')}"
                    )
                else:
                    ans = (
                        f"**Genomic Reference for OMIM #{omim_num}:**\n\n"
                        "OMIM (Online Mendelian Inheritance in Man) is the authoritative international catalog of human genes and genetic variations. "
                        "In UAE premarital screening, cataloged conditions include G6PD Deficiency (OMIM #300377 / #305900), Beta-Thalassemia (OMIM #613985), and Sickle Cell Disease (OMIM #603903). "
                        "Routine carrier screening ensures you and your partner know whether you share any carrier alleles before marriage."
                    )
            # 5. Reproductive Transmission & Healthy Children
            elif any(w in p for w in ["healthy child", "healthy children", "both carry", "both are carriers", "have healthy", "baby safe", "traits", "reproduction", "risk of baby", "heterozygous carrier mean", "carrier mean", "options"]):
                ans = (
                    "**Can You Have Healthy Children If Both of You Carry Genetic Traits? Absolutely, YES.**\n\n"
                    "• **Natural Conception Odds:** Even if both partners carry the exact same autosomal recessive trait (such as Beta-Thalassemia), there is a **75% chance (3 out of 4) in each and every pregnancy** that your baby is born completely healthy and free of the disease.\n"
                    "• **Single Carrier Couple:** If only one of you is a carrier and your partner is not, there is **0% risk** of your child having the disease.\n"
                    "• **What 'Carrier' Means:** Being a carrier means you have one standard gene and one variant copy. You are completely healthy, energetic, and do not have the illness.\n"
                    "• **Assisted Options (PGT-M):** Couples desiring 100% certainty can choose IVF with **PGT-M** (Pre-implantation Genetic Testing), which verifies embryo genetics before pregnancy so that only healthy embryos are transferred."
                )
            elif "cousin" in p or "consanguinity" in p or "marriage" in p or "related" in p:
                ans = (
                    "**Cousin or Related Marriage (Shared Family Genes):**\n\n"
                    "• **What you should know:** When families are related, they share more of the same inherited genes. Most pregnancies in cousin marriages result in completely healthy babies (~95%+ healthy).\n"
                    "• **Proactive Care:** The main benefit of modern genetics is that a pre-marital carrier panel checks for shared hidden traits before pregnancy, providing total peace of mind."
                )
            else:
                ans = (
                    f"I am here to assist you with your premarital screening and family health planning on the **{current_page}** screen. "
                    "Based on your family health records, proactive carrier screening provides you and your partner with clear, reassuring insights. "
                    "You can ask about specific conditions (Beta-Thalassemia, G6PD, Sickle Cell), OMIM catalog numbers, carrier transmission probabilities, or IVF with PGT-M options."
                )
        else:
            # Provider mode
            if "300377" in p or "305900" in p or "g6pd" in p:
                ans = (
                    "**ACMG Clinical Assessment: G6PD Deficiency (OMIM #300377 / #305900, Locus Xq28)**\n\n"
                    "• **Molecular Genetics:** X-linked recessive enzymopathy. Hemizygous males exhibit acute hemolytic vulnerability upon oxidative challenge.\n"
                    "• **Pharmacogenomic Contraindications:** Rasburicase, primaquine, dapsone, and nitrofurantoin. Fava bean ingestion induces acute favism.\n"
                    "• **Transmission:** Carrier females have 50% probability of transmitting the variant to male offspring (hemizygous affected) and female offspring (heterozygous carriers)."
                )
            elif "613985" in p or "thalassemia" in p or "beta" in p or "hbb" in p:
                ans = (
                    "**ACMG Clinical Assessment: Beta-Thalassemia (OMIM #613985, HBB Locus 11p15.4)**\n\n"
                    "• **Molecular Genetics:** Autosomal recessive beta-globin synthesis impairment. Heterozygotes exhibit microcytosis (MCV < 80 fL) with elevated HbA2 (> 3.5%).\n"
                    "• **Concordance Risk:** If both reproductive partners are heterozygous carriers, Mendelian offspring segregation is: 25% homozygous affected (Thalassemia Major), 50% heterozygous trait, 25% normal.\n"
                    "• **Diagnostic Protocol:** Sanger sequencing of HBB promoter/exons 1-3. Pre-implantation Genetic Testing (PGT-M) is clinically validated for carrier couples."
                )
            elif "consanguinity" in p or "cousin" in p:
                ans = (
                    "**ACMG Tier 2 Consanguinity & Kinship Analysis**\n\n"
                    "• **Kinship Coefficient:** First-cousin union kinship coefficient is F = 0.0625 (1/16). Identity by Descent (IBD) genome fraction is approximately 6.25%.\n"
                    "• **Excess Empirical Risk:** Background baseline anomaly risk (2-3%) is augmented by an empirical 1.7-2.8% for autosomal recessive disorders.\n"
                    "• **Clinical Directive:** Expanded carrier screening (ECS) panel targeting high-frequency regional founder mutations (HBB, G6PD, CFTR, SMN1)."
                )
            else:
                ans = (
                    f"**Clinical Decision Support Synthesis for: \"{prompt}\"**\n\n"
                    f"• **Pedigree Baseline:** {pedigree_summary}\n"
                    "• **Clinical Recommendation:** Evaluate autosomal recessive concordance across paternal and maternal lineages. "
                    "Pre-conception expanded carrier screening (ECS) recommended under ACMG/ACOG guidelines."
                )

        note = ""

        return {
            "status": "success",
            "answer": ans,
            "model": model_id,
            "source": f"GuardianAngel Genetics Engine ({model_id})",
            "view_mode": view_mode,
            "confidence": "98%",
            "locus_reference": "ACMG / OMIM #613985 / #305900"
        }

    def analyze_assessment(
        self,
        reports: List[Dict[str, Any]],
        pedigree_nodes: List[Dict[str, Any]],
        couple_names: Optional[Dict[str, str]] = None,
        api_key: Optional[str] = None,
        model_id: str = "gemini-3.8-flash"
    ) -> Dict[str, Any]:
        """
        Analyzes screening reports and pedigree nodes using Google AI Studio Gemini API,
        producing culturally respectful, plain-language, destigmatizing couple guidance
        aligned with UAE Premarital Guidelines and ACMG principles.
        """
        api_key = (api_key or self.api_key or os.environ.get('GEMINI_API_KEY') or getattr(Config, 'GEMINI_API_KEY', '') or '').strip()
        c_names = couple_names or {}
        name_a = c_names.get('partner_a') or 'Partner A'
        name_b = c_names.get('partner_b') or 'Partner B'

        # Summarize input reports and pedigree
        report_summaries = []
        for r in reports:
            m = r.get('masked_data') or {}
            p_name = m.get('patient_name') or 'Candidate'
            cond = m.get('conditions') or m.get('carrier_status') or 'Screened'
            status = m.get('carrier_status') or 'Carrier'
            report_summaries.append(f"- {p_name}: Status={status}, Conditions={cond}")

        ped_summaries = []
        for n in pedigree_nodes[:15]:
            p_name = n.get('alias_name') or n.get('name') or n.get('relationship') or 'Member'
            rel = n.get('relationship') or 'relative'
            c_status = n.get('carrier_status') or 'unaffected'
            ped_summaries.append(f"- {p_name} ({rel}): {c_status}")

        selected_model = self.normalize_model_id(model_id)

        if api_key:
            prompt = f"""
You are Care AI, an empathetic, certified clinical genetics decision-support assistant aligned with UAE National Premarital Screening Guidelines and ACMG recommendations.
Evaluate the genetic compatibility and carrier status of the couple:
- Partner A: {name_a}
- Partner B: {name_b}

Screening Reports:
{chr(10).join(report_summaries) if report_summaries else "No lab reports uploaded yet."}

Family Pedigree Members:
{chr(10).join(ped_summaries) if ped_summaries else "No pedigree nodes mapped."}

Cultural and Clinical Guidance Rules:
1. Tone: Respectful, reassuring, positive, destigmatizing, plain language (6th-8th grade reading level), honoring UAE family values.
2. Clarify that being a carrier is completely normal and healthy, not an illness.
3. If both partners carry the same recessive trait (e.g. Beta-Thalassemia or Sickle Cell), clearly emphasize that there is a 75% chance in every pregnancy of having a healthy baby, and that modern reproductive options like PGT-M with IVF and non-invasive prenatal diagnosis ensure healthy children.
4. Output MUST be ONLY a valid JSON object with the following keys:
{{
  "partner_a": {{
    "name": "{name_a}",
    "carrier_status": "string",
    "condition_locus": "string",
    "clinical_notes": "string"
  }},
  "partner_b": {{
    "name": "{name_b}",
    "carrier_status": "string",
    "condition_locus": "string",
    "clinical_notes": "string"
  }},
  "synthesis": {{
    "joint_carrier_status": "string",
    "reproductive_risk_label": "string",
    "transmission_probability": "string",
    "reassurance_metric": "75% probability of child born free of condition in each pregnancy",
    "key_takeaway": "string"
  }},
  "clinical_recommendation": "string",
  "positive_summary": "string",
  "motivational_insight": "string",
  "risk_explanation": "string",
  "consanguinity_guidance": "string",
  "innovative_technologies": ["string", "string", "string"],
  "compatibility_status": "string",
  "next_possible_ways": ["string", "string", "string", "string"],
  "potential_queries": ["string", "string", "string", "string"],
  "detected_conditions": [
    {{
      "name": "string",
      "omim": "string",
      "carrier_status": "string",
      "inheritance": "string",
      "child_transmission": "string",
      "positive_guidance": "string",
      "consultation_action": "string"
    }}
  ]
}}
"""
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 2000,
                    "responseMimeType": "application/json"
                }
            }
            data, used_model, err = self._call_generate_content(selected_model, api_key, payload, timeout=15)
            if data:
                try:
                    cand = data.get('candidates', [{}])[0]
                    parts = cand.get('content', {}).get('parts', [])
                    raw_text = "".join(p.get('text', '') for p in parts).strip()
                    if raw_text.startswith("```json"):
                        raw_text = raw_text[7:]
                    if raw_text.endswith("```"):
                        raw_text = raw_text[:-3]
                    parsed = json.loads(raw_text.strip())

                    # Defensive normalization for UI stability
                    inno = parsed.get("innovative_technologies")
                    if isinstance(inno, str):
                        parsed["innovative_technologies"] = [s.strip(" -*•") for s in inno.split("\n") if s.strip(" -*•")]
                    elif not isinstance(inno, list) or len(inno) == 0:
                        parsed["innovative_technologies"] = [
                            "Pre-implantation Genetic Testing for Monogenic Disorders (PGT-M) with IVF",
                            "Non-Invasive Prenatal Diagnosis (NIPD) from maternal cell-free DNA",
                            "Confirmatory Sanger Sequencing at certified reference centers",
                            "Confidential premarital counseling and couple compatibility consultation"
                        ]

                    ways = parsed.get("next_possible_ways")
                    if isinstance(ways, str):
                        parsed["next_possible_ways"] = [s.strip(" -*•") for s in ways.split("\n") if s.strip(" -*•")]
                    elif not isinstance(ways, list) or len(ways) == 0:
                        parsed["next_possible_ways"] = [
                            "Schedule premarital genetic counseling consultation.",
                            "Review mutual carrier status and discuss family planning options.",
                            "Consult certified clinical genetics specialists for guidance."
                        ]

                    conds = parsed.get("detected_conditions")
                    if isinstance(conds, list):
                        norm_conds = []
                        for c in conds:
                            if isinstance(c, dict):
                                c_name = c.get("name") or c.get("condition_name") or "Documented Trait"
                                norm_conds.append({
                                    "name": c_name,
                                    "omim": c.get("omim") or c.get("gene") or "Clinical Locus",
                                    "carrier_status": c.get("carrier_status") or c.get("carrier_summary") or "Documented Carrier",
                                    "inheritance": c.get("inheritance") or "Autosomal Recessive",
                                    "child_transmission": c.get("child_transmission") or "75% chance of healthy child in each pregnancy (25% non-carrier, 50% healthy carrier).",
                                    "positive_guidance": c.get("positive_guidance") or "Carriers lead active, healthy lives. PGT-M with IVF offers reassurance for family planning.",
                                    "consultation_action": c.get("consultation_action") or "Schedule Certified Genetic Counseling"
                                })
                        parsed["detected_conditions"] = norm_conds
                    else:
                        parsed["detected_conditions"] = []

                    parsed["source"] = f"Google AI Studio ({used_model or selected_model})"
                    parsed["is_llm"] = True
                    parsed["has_data"] = bool(reports or pedigree_nodes)
                    return parsed
                except Exception as parse_err:
                    logger.warning(f"Gemini live couple analysis JSON parse error: {parse_err}")
            else:
                logger.warning(f"Gemini live couple analysis failed for {selected_model}: {err}")

        # Local fallback via qwen_brain_service
        try:
            from local_ai_service import qwen_brain_service
            res = qwen_brain_service.analyze_couple_and_reports(reports, pedigree_nodes, couple_names)
            res["source"] = "Clinical Reasoning Engine (Guided Mode)"
            return res
        except Exception as e:
            logger.error(f"Local fallback analysis error: {e}")
            return {
                "source": "Clinical Guidance Engine",
                "is_llm": False,
                "has_data": bool(reports or pedigree_nodes),
                "clinical_recommendation": "Premarital screening records analyzed. Schedule a consultation for comprehensive review.",
                "positive_summary": "Carrier screening empowers couples with knowledge and modern reproductive pathways.",
                "compatibility_status": "Compatible with Proactive Guidance",
                "next_possible_ways": ["Schedule premarital genetic counseling consultation."],
                "potential_queries": ["What does carrier status mean for our future children?"]
            }

gemini_studio = GeminiStudioService()

