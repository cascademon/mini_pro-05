import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateBookCover } from '../api/booksApi';
import '../styles/AiCoverGeneratePage.css';
import { DEFAULT_POSTER } from '../constants';
import { useEphemeralApiKey } from '../hooks/useEphemeralApiKey';

function AiCoverGeneratePage() {
  const navigate = useNavigate();

  const [draft, setDraft] = useState(null);
  const [coverPrompt, setCoverPrompt] = useState('');
  const [apiKey, setApiKey] = useEphemeralApiKey();
  const [showApiKey, setShowApiKey] = useState(false);
  const [generatedPosters, setGeneratedPosters] = useState([]);
  const [selectedPoster, setSelectedPoster] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const savedDraft = sessionStorage.getItem('bookDraft');

    if (!savedDraft) {
      alert('도서 정보가 없습니다. 먼저 도서 정보를 입력해주세요.');
      navigate('/add-book');
      return;
    }

    try {
      const parsed = JSON.parse(savedDraft);
      setDraft(parsed);
      setCoverPrompt(parsed.coverPrompt || '');
    } catch (err) {
      console.error('도서 정보 불러오기 실패:', err);
      navigate('/add-book');
    }
  }, [navigate]);

  const handleApiKeyChange = (value) => {
    setApiKey(value);
  };

  const generatePoster = async () => {
    if (!draft?.title?.trim()) {
      alert('제목 정보가 없습니다.');
      return;
    }

    if (!apiKey.trim()) {
      alert('OpenAI API 키를 입력해주세요.');
      return;
    }

    setGenerating(true);
    setGeneratedPosters([]);
    setSelectedPoster('');

    try {
      const res = await fetch('http://localhost:8080/ai/cover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: draft.title,
          genre: draft.genre,
          moods: draft.moods || [],
          description: draft.description || '도서 설명 없음',
          coverPrompt: coverPrompt.trim(),
          apiKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'AI 표지 생성 실패');
      }

      const posters = Array.isArray(data.posters)
        ? data.posters.filter(Boolean)
        : data.poster
          ? [data.poster]
          : [];

      if (posters.length === 0) {
        throw new Error('이미지 데이터가 없습니다.');
      }

      setGeneratedPosters(posters);
      setSelectedPoster(posters[0]);
    } catch (err) {
      console.error('표지 생성 실패:', err);
      alert(`AI 표지 생성에 실패했습니다.\n${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const applyPoster = async () => {
    if (!selectedPoster) {
      alert('사용할 표지를 선택해주세요.');
      return;
    }

    // 기존 도서(id 있음) → 서버에 바로 저장
    if (draft?.id) {
      try {
        await updateBookCover(draft.id, selectedPoster);
        navigate(`/books/${draft.id}`);
        return;
      } catch (err) {
        console.error('표지 저장 실패:', err);
        alert('표지 저장에 실패했습니다.');
        return;
      }
    }

    // 신규 도서 → sessionStorage에 임시 저장 후 등록 페이지로 복귀
    sessionStorage.setItem('selectedPoster', selectedPoster);

    const savedDraft = sessionStorage.getItem('bookDraft');
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        sessionStorage.setItem(
          'bookDraft',
          JSON.stringify({ ...parsedDraft, poster: selectedPoster })
        );
      } catch (err) {
        console.error('표지 저장 실패:', err);
      }
    }

    navigate('/add-book');
  };

  return (
    <main className="ai-cover-page">
      <section className="ai-cover-inner">
        <div className="ai-cover-header">
          <button type="button" onClick={() => navigate('/add-book')}>
            도서 등록으로 돌아가기
          </button>

          <p>AI 표지 생성</p>
          <h1>책 분위기에 맞는 표지를 생성하세요</h1>
          <span>
            입력한 도서 정보를 바탕으로 AI 표지를 생성한 뒤, 마음에 드는 표지를 선택할 수 있습니다.
          </span>
        </div>

        <section className="ai-cover-info">
          <div>
            <strong>제목</strong>
            <p>{draft?.title || '-'}</p>
          </div>

          <div>
            <strong>장르</strong>
            <p>{draft?.genre || '-'}</p>
          </div>

          <div>
            <strong>분위기</strong>
            <p>
              {draft?.moods?.length > 0 ? draft.moods.join(', ') : '-'}
            </p>
          </div>

          <div>
            <strong>설명</strong>
            <p>{draft?.description || '도서 설명 없음'}</p>
          </div>

          <div>
            <strong>요청사항</strong>
            <textarea
              value={coverPrompt}
              onChange={(e) => setCoverPrompt(e.target.value)}
              placeholder="예: 어두운 도서관을 배경으로 한 미스터리 분위기의 표지"
              rows="3"
              style={{ width: '100%', marginTop: 6, resize: 'vertical' }}
            />
          </div>
        </section>

        <section className="ai-key-section">
          <label>OpenAI API 키</label>

          <div className="ai-key-row">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="sk-..."
            />

            <button
              type="button"
              onClick={() => setShowApiKey((prev) => !prev)}
            >
              {showApiKey ? '숨기기' : '보기'}
            </button>

            <button
              type="button"
              className="ai-generate-main-btn"
              onClick={generatePoster}
              disabled={generating}
            >
              {generating ? '생성 중...' : '표지 3장 생성'}
            </button>
          </div>
        </section>

        {generatedPosters.length > 0 ? (
          <>
            <section className="ai-cover-grid">
              {generatedPosters.map((poster, index) => (
                <button
                  type="button"
                  key={poster}
                  className={`ai-cover-card ${
                    selectedPoster === poster ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedPoster(poster)}
                >
                  <img src={poster} alt={`AI 표지 ${index + 1}`} />
                  <span>{index + 1}번 표지</span>
                </button>
              ))}
            </section>

            <button
              type="button"
              className="apply-cover-btn"
              onClick={applyPoster}
            >
              선택한 표지 사용하기
            </button>
          </>
        ) : (
          <section className="ai-cover-empty">
            <img src={DEFAULT_POSTER} alt="기본 표지" />
            <p>아직 생성된 표지가 없습니다.</p>
          </section>
        )}
      </section>
    </main>
  );
}

export default AiCoverGeneratePage;
