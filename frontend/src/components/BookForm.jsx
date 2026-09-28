import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BookForm.css';
import { DEFAULT_POSTER, MOODS } from '../constants';
import { useEphemeralApiKey } from '../hooks/useEphemeralApiKey';

const genreOptions = [
  '소설',
  '청소년 문학',
  '역사',
  '철학·종교',
  '경제·경영',
  '에세이',
  '사회과학',
  '만화·그래픽노블',
  '과학',
  '문학 비평',
  '컴퓨터·IT',
  '어린이 교양',
];


function BookForm({ onAddBook }) {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [genre, setGenre] = useState('소설');
  const [moods, setMoods] = useState([]);
  const [coverPrompt, setCoverPrompt] = useState('');
  const [poster, setPoster] = useState(DEFAULT_POSTER);
  const [apiKey, setApiKey] = useEphemeralApiKey();
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    const savedDraft = sessionStorage.getItem('bookDraft');
    const selectedPoster = sessionStorage.getItem('selectedPoster');

    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);

        setTitle(parsedDraft.title || '');
        setAuthor(parsedDraft.author || '');
        setDescription(parsedDraft.description || '');
        setReleaseDate(parsedDraft.releaseDate || '');
        setGenre(parsedDraft.genre || '소설');
        setMoods(parsedDraft.moods || []);
        setCoverPrompt(parsedDraft.coverPrompt || '');
        setPoster(parsedDraft.poster || DEFAULT_POSTER);
      } catch (err) {
        console.error('임시 저장된 도서 정보 복원 실패:', err);
      }
    }

    if (selectedPoster) {
      setPoster(selectedPoster);
    }
  }, []);

  const saveDraft = () => {
    const draft = {
      title,
      author,
      description,
      releaseDate,
      genre,
      moods,
      coverPrompt,
      poster,
    };

    sessionStorage.setItem('bookDraft', JSON.stringify(draft));
  };

  const handleClick = () => {
    if (!title.trim()) {
      alert('제목을 입력하세요');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const newBook = {
      title: title.trim(),
      author: author.trim(),
      description: description.trim(),
      publishedDate: releaseDate,
      genre,
      moods,
      modifiedDate: today,
      createdDate: today,
      poster: poster || DEFAULT_POSTER,
      likes: 0,
    };

    onAddBook(newBook);

    setTitle('');
    setAuthor('');
    setDescription('');
    setReleaseDate('');
    setGenre('소설');
    setMoods([]);
    setCoverPrompt('');
    setPoster(DEFAULT_POSTER);

    sessionStorage.removeItem('bookDraft');
    sessionStorage.removeItem('selectedPoster');
  };

  const handleApiKeyChange = (value) => {
    setApiKey(value);
  };

  const toggleMood = (selectedMood) => {
    setMoods((prevMoods) =>
      prevMoods.includes(selectedMood)
        ? prevMoods.filter((mood) => mood !== selectedMood)
        : [...prevMoods, selectedMood]
    );
  };

  const moveToAiCoverPage = () => {
    if (!title.trim()) {
      alert('AI 표지를 생성하려면 먼저 제목을 입력해주세요.');
      return;
    }

    saveDraft();
    navigate('/add-book/ai-cover');
  };

  const moveToPublicCoverPage = () => {
    saveDraft();
    navigate('/covers/public');
  };

  return (
    <div className="book-form">
      <div className="form-section">
        <h3>도서 정보</h3>
        <p>장르와 분위기를 함께 설정하면 나중에 취향 기반 탐색과 AI 표지 생성에 활용할 수 있습니다.</p>
      </div>

      <div className="book-form-layout">
        <div className="form-left">
          <div className="form-group">
            <label>제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="도서 제목을 입력하세요"
            />
          </div>

          <div className="form-group">
            <label>작가</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="작가 이름"
            />
          </div>

          <div className="form-group">
            <label>설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="도서 설명을 입력하세요"
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>출판일</label>
              <input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>장르</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              >
                {genreOptions.map((option) => (
                  <option value={option} key={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>표지 생성 요청사항</label>
            <textarea
              className="cover-prompt-box"
              value={coverPrompt}
              onChange={(e) => setCoverPrompt(e.target.value)}
              placeholder="예: 어두운 도서관을 배경으로 한 미스터리 분위기의 표지"
              rows="3"
            />
            <p className="help-text">
              AI 표지 생성 시 참고할 추가 요청사항을 입력하세요.
            </p>
          </div>

          <div className="form-group mood-group">
            <label>분위기</label>

            <div className="mood-select-grid">
              {MOODS.map((option) => (
                <button
                  type="button"
                  key={option}
                  className={`mood-chip ${moods.includes(option) ? 'selected' : ''}`}
                  onClick={() => toggleMood(option)}
                >
                  {option}
                </button>
              ))}
            </div>

            <p className="mood-help-text">
              중복 선택 가능
            </p>
          </div>
        </div>

        <div className="form-right">
          <div className="form-group poster-section">
            <div className="poster-title-row">
              <div>
                <label>책 표지</label>
                <p className="help-text">
                  AI 표지를 생성하거나 다른 사용자가 공개한 표지를 선택할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="poster-preview">
              <img
                src={poster || DEFAULT_POSTER}
                alt="Book poster"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_POSTER;
                }}
              />
            </div>

            <div className="ai-box">
              <div className="form-group">
                <label>OpenAI API 키</label>

                <div className="api-key-input-wrap">
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
                    {showApiKey ? '숨김' : '보기'}
                  </button>
                </div>
              </div>

              <div className="cover-action-buttons">
                <button
                  type="button"
                  onClick={moveToAiCoverPage}
                  className="generate-btn"
                >
                  AI 표지 생성하기
                </button>

                <button
                  type="button"
                  onClick={moveToPublicCoverPage}
                  className="public-cover-btn"
                >
                  표지 템플릿
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button onClick={handleClick} className="add-btn">
        도서 추가
      </button>
    </div>
  );
}

export default BookForm;
