import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookById, replaceBook, moveBookToTrash, updateReadingStatus } from '../api/booksApi';
import { getReviewsByBookId, addReview, updateReview, deleteReview } from '../api/reviewsApi';
import { getHighlightsByBookId, addHighlight, deleteHighlight } from '../api/highlightsApi';
import { useAuth } from '../context/AuthContext';
import { useReadingGoal } from '../context/ReadingGoalContext';
import { getMyBookshelves, assignBookToShelf } from '../api/bookshelfApi';
import { DEFAULT_POSTER, STATUS_LABEL_TO_API, STATUS_API_TO_LABEL } from '../constants';
import BookDetailSidePanel from '../components/BookDetailSidePanel';
import BookDetailModals from '../components/BookDetailModals';
import { useEphemeralApiKey } from '../hooks/useEphemeralApiKey';
import '../styles/BookDetailPage.css';

const statusOptions = [
  { label: '읽고 싶은 책', icon: '☆' },
  { label: '읽는 중', icon: '▯' },
  { label: '중단한 책', icon: '↓' },
  { label: '완독', icon: '✓' },
];

function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { onBookFinished } = useReadingGoal();

  const [bookshelves, setBookshelves] = useState([]);
  const [currentShelfId, setCurrentShelfId] = useState(null);
  const [shelfSubMenuOpen, setShelfSubMenuOpen] = useState(false);

  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [highlights, setHighlights] = useState([]);

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editRating, setEditRating] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [aiApiKey, setAiApiKey] = useEphemeralApiKey();
  const [showAiApiKey, setShowAiApiKey] = useState(false);
  const [aiPosters, setAiPosters] = useState([]);
  const [aiGenerating, setAiGenerating] = useState(false);

  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [bookStatus, setBookStatus] = useState('');

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [highlightModalOpen, setHighlightModalOpen] = useState(false);

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [selectedReviewTags, setSelectedReviewTags] = useState([]);

  const [highlightQuote, setHighlightQuote] = useState('');
  const [highlightNote, setHighlightNote] = useState('');
  const [highlightPage, setHighlightPage] = useState('');
  const [highlightSpoiler, setHighlightSpoiler] = useState(false);

  const [formData, setFormData] = useState({
    title: '', author: '', description: '', publishedDate: '',
    genre: '소설', modifiedDate: '', createdDate: '', poster: '', likes: 0,
  });

  useEffect(() => {
    async function loadBook() {
      try {
        const data = await getBookById(id);
        setBook(data);
        setFormData({
          title: data.title || '',
          author: data.author || '',
          description: data.description || '',
          publishedDate: data.publishedDate || '',
          genre: data.genre || '소설',
          modifiedDate: data.modifiedDate || '',
          createdDate: data.createdDate || '',
          poster: data.poster || DEFAULT_POSTER,
          likes: data.likes || 0,
        });
        setBookStatus(STATUS_API_TO_LABEL[data.readingStatus] || '');
        setCurrentShelfId(data.bookshelfId || null);
        const reviewData = await getReviewsByBookId(id);
        setReviews(reviewData);
        const highlightData = await getHighlightsByBookId(id);
        setHighlights(highlightData);
      } catch (err) {
        console.error('상세 도서 불러오기 실패:', err);
        setError('도서를 불러오지 못했어요.');
      } finally {
        setLoading(false);
      }
    }
    loadBook();
  }, [id]);

  useEffect(() => {
    if (!user?.id) return;
    getMyBookshelves(user.id).then(setBookshelves).catch(() => {});
  }, [user]);

  const handleAssignShelf = async (shelfId) => {
    try {
      await assignBookToShelf(id, shelfId);
      setCurrentShelfId(shelfId);
    } catch (e) {
      console.error('책장 배정 실패:', e);
      alert('책장 배정에 실패했습니다.');
    }
  };

  const handleRemoveFromShelf = async () => {
    try {
      await assignBookToShelf(id, null);
      setCurrentShelfId(null);
    } catch (e) {
      console.error('책장 해제 실패:', e);
    }
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  };

  const getReviewText = (review) =>
    review.content || review.text || review.review || review.comment || '';

  const handleAiGenerate = async () => {
    if (!formData.title?.trim()) { alert('제목 정보가 없습니다.'); return; }
    if (!aiApiKey.trim()) { alert('OpenAI API 키를 입력해주세요.'); return; }
    setAiGenerating(true);
    setAiPosters([]);
    try {
      const res = await fetch('http://localhost:8080/ai/cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title, genre: formData.genre,
          moods: book?.moods || [], description: formData.description || '도서 설명 없음',
          coverPrompt: '', apiKey: aiApiKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'AI 표지 생성 실패');
      const posters = Array.isArray(data.posters)
        ? data.posters.filter(Boolean)
        : data.poster ? [data.poster] : [];
      if (posters.length === 0) throw new Error('이미지 데이터가 없습니다.');
      setAiPosters(posters);
      setFormData((prev) => ({ ...prev, poster: posters[0] }));
    } catch (err) {
      console.error('표지 생성 실패:', err);
      alert(`AI 표지 생성에 실패했습니다.\n${err.message}`);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) { alert('제목을 입력하세요.'); return; }
    try {
      const today = new Date().toISOString().slice(0, 10);
      const updated = await replaceBook(id, { ...book, ...formData, poster: formData.poster || DEFAULT_POSTER, modifiedDate: today });
      setBook(updated);
      setFormData({
        title: updated.title || '', author: updated.author || '',
        description: updated.description || '', publishedDate: updated.publishedDate || '',
        genre: updated.genre || '소설', modifiedDate: updated.modifiedDate || '',
        createdDate: updated.createdDate || '', poster: updated.poster || DEFAULT_POSTER,
        likes: updated.likes || 0,
      });
      setIsEditing(false);
      setSaveMessage('도서 정보가 저장되었습니다.');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (err) {
      console.error('도서 저장 실패:', err);
      alert('도서 저장 중 오류가 발생했습니다.');
    }
  };

  const handleStatusChange = async (label) => {
    const isSame = label === bookStatus;
    setBookStatus(isSame ? '' : label);
    setSideMenuOpen(false);
    try {
      const apiValue = isSame ? null : STATUS_LABEL_TO_API[label];
      await updateReadingStatus(id, apiValue);
      if (!isSame && apiValue === 'finished' && book) onBookFinished(book);
    } catch (e) {
      console.error('상태 변경 실패:', e);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 이 도서를 휴지통으로 이동하시겠습니까?')) return;
    try {
      await moveBookToTrash(id);
      alert('도서가 휴지통으로 이동되었습니다.');
      navigate('/books');
    } catch (err) {
      console.error('휴지통 이동 실패:', err);
      alert('도서 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      title: book.title || '', author: book.author || '',
      description: book.description || '', publishedDate: book.publishedDate || '',
      genre: book.genre || '소설', modifiedDate: book.modifiedDate || '',
      createdDate: book.createdDate || '', poster: book.poster || DEFAULT_POSTER,
      likes: book.likes || 0,
    });
    setIsEditing(false);
  };

  const handleUpdateReview = async (reviewId) => {
    if (!editContent.trim()) return;
    try {
      const updated = await updateReview(reviewId, { content: editContent.trim(), rating: editRating, writer: user?.nickname || '익명' });
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? updated : r)));
      setEditingReviewId(null);
    } catch (e) {
      console.error('리뷰 수정 실패:', e);
      alert('리뷰 수정 중 오류가 발생했습니다.');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewContent.trim()) { alert('리뷰 내용을 입력해주세요.'); return; }
    try {
      const saved = await addReview({
        bookId: id, userId: user?.id, writer: user?.nickname || '익명',
        rating: reviewRating, content: reviewContent.trim(),
        createdAt: new Date().toISOString().slice(0, 10),
      });
      setReviews((prev) => [saved, ...prev]);
      setReviewRating(0); setReviewContent(''); setSelectedReviewTags([]); setReviewModalOpen(false);
    } catch (err) {
      console.error('리뷰 등록 실패:', err);
      alert('리뷰 등록 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('정말 이 리뷰를 삭제하시겠습니까?')) return;
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error('리뷰 삭제 실패:', err);
      alert('리뷰 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSubmitHighlight = async (e) => {
    e.preventDefault();
    if (!highlightQuote.trim()) { alert('인상 깊은 문장을 입력해주세요.'); return; }
    try {
      const saved = await addHighlight({ bookId: id, userId: user?.id || null, quote: highlightQuote.trim(), note: highlightNote.trim(), page: highlightPage, isSpoiler: highlightSpoiler });
      setHighlights((prev) => [saved, ...prev]);
    } catch (err) {
      console.error('하이라이트 등록 실패:', err);
      alert('하이라이트 등록 중 오류가 발생했습니다.');
    }
    setHighlightQuote(''); setHighlightNote(''); setHighlightPage(''); setHighlightSpoiler(false); setHighlightModalOpen(false);
  };

  const handleDeleteHighlight = async (highlightId) => {
    if (!window.confirm('이 하이라이트를 삭제하시겠습니까?')) return;
    try {
      await deleteHighlight(highlightId);
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
    } catch (err) {
      console.error('하이라이트 삭제 실패:', err);
      alert('하이라이트 삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) return <p className="loading">불러오는 중...</p>;
  if (error) return <p className="error">에러: {error}</p>;
  if (!book) return <p className="error">도서를 찾을 수 없습니다.</p>;

  return (
    <main className="book-detail-page">
      <div className="detail-page-inner">
        <button className="back-btn" onClick={() => navigate('/books')}>← 책 둘러보기</button>
        {saveMessage && <div className="save-message">{saveMessage}</div>}

        <section className="book-detail-layout">
          <BookDetailSidePanel
            book={book}
            formData={formData}
            isEditing={isEditing}
            bookStatus={bookStatus}
            sideMenuOpen={sideMenuOpen}
            setSideMenuOpen={setSideMenuOpen}
            statusOptions={statusOptions}
            onStatusChange={handleStatusChange}
            bookshelves={bookshelves}
            currentShelfId={currentShelfId}
            shelfSubMenuOpen={shelfSubMenuOpen}
            setShelfSubMenuOpen={setShelfSubMenuOpen}
            onAssignShelf={handleAssignShelf}
            onRemoveFromShelf={handleRemoveFromShelf}
            onOpenHighlight={() => setHighlightModalOpen(true)}
            onOpenReview={() => setReviewModalOpen(true)}
            aiApiKey={aiApiKey}
            setAiApiKey={setAiApiKey}
            showAiApiKey={showAiApiKey}
            setShowAiApiKey={setShowAiApiKey}
            aiPosters={aiPosters}
            aiGenerating={aiGenerating}
            onAiGenerate={handleAiGenerate}
            onSelectPoster={(poster) => setFormData((prev) => ({ ...prev, poster }))}
            onStartEdit={() => setIsEditing(true)}
            onDelete={handleDelete}
            onSave={handleSave}
            onCancelEdit={handleCancelEdit}
          />

          <section className="book-main-panel">
            {!isEditing ? (
              <div className="book-info-view">
                <h1>{book.title}</h1>
                <div className="book-sub-info">
                  <span>{book.author || '작가 미상'}</span>
                  <em>—</em>
                  <span>{book.publishedDate || '출판일 미등록'}</span>
                </div>
                <p className="book-description">{book.description || '등록된 설명이 없습니다.'}</p>
                {book.moods?.length > 0 && (
                  <div className="book-mood-tags">
                    {book.moods.map((mood) => <span key={mood} className="book-mood-tag">{mood}</span>)}
                  </div>
                )}
                <dl className="book-info-table">
                  <div><dt>장르</dt><dd>{book.genre || '소설'}</dd></div>
                  <div><dt>평균 평점</dt><dd>{getAverageRating()} / 5.0</dd></div>
                  <div><dt>리뷰 수</dt><dd>{reviews.length}개</dd></div>
                  <div><dt>좋아요</dt><dd>{book.likes || 0}개</dd></div>
                </dl>
                <div className="reading-status-list">
                  <p><span>▯</span><strong>{Math.max(1, reviews.length)}</strong>명이 이 책을 읽는 중입니다</p>
                  <p><span>✓</span><strong>{reviews.length}</strong>명이 리뷰를 남겼습니다</p>
                  <p><span>☆</span><strong>{book.likes || 0}</strong>명이 이 책을 좋아합니다</p>
                </div>
              </div>
            ) : (
              <div className="book-edit-view">
                <h1>도서 정보 수정</h1>
                <div className="form-group">
                  <label>제목 *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>작가</label>
                  <input type="text" name="author" value={formData.author} onChange={handleInputChange} placeholder="작가 이름" />
                </div>
                <div className="form-group">
                  <label>설명</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows="5" placeholder="도서 설명" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>등록일</label>
                    <input type="date" name="createdDate" value={formData.createdDate} readOnly />
                  </div>
                  <div className="form-group">
                    <label>출판일</label>
                    <input type="date" name="publishedDate" value={formData.publishedDate} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>장르</label>
                    <select name="genre" value={formData.genre} onChange={handleInputChange}>
                      <option value="소설">소설</option>
                      <option value="에세이">에세이</option>
                      <option value="경제·경영">경제·경영</option>
                      <option value="역사">역사</option>
                      <option value="과학">과학</option>
                      <option value="철학·종교">철학·종교</option>
                      <option value="사회과학">사회과학</option>
                      <option value="청소년 문학">청소년 문학</option>
                      <option value="컴퓨터·IT">컴퓨터·IT</option>
                      <option value="문학 비평">문학 비평</option>
                      <option value="만화·그래픽노블">만화·그래픽노블</option>
                      <option value="시">시</option>
                      <option value="자기계발">자기계발</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>수정일</label>
                    <input type="date" name="modifiedDate" value={formData.modifiedDate} readOnly />
                  </div>
                </div>
              </div>
            )}

            <section className="review-section">
              <div className="review-tab-row">
                <button type="button" className="active">리뷰 <span>{reviews.length}</span></button>
                <button type="button">명대사 <span>{highlights.length}</span></button>
              </div>

              <div className="detail-review-list">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <article className="detail-review-item" key={review.id}>
                      <div className="detail-review-head">
                        <div>
                          <strong>{review.writer || review.nickname || review.author || '익명'}</strong>
                          <span>{review.createdAt || review.createdDate || '작성일 없음'}</span>
                        </div>
                        <em>{'★'.repeat(review.rating || 0)}{'☆'.repeat(5 - (review.rating || 0))}</em>
                      </div>

                      {editingReviewId === review.id ? (
                        <div>
                          <div className="modal-rating-row" style={{ marginBottom: 8 }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button type="button" key={star} className={editRating >= star ? 'selected' : ''} onClick={() => setEditRating(star)}>★</button>
                            ))}
                          </div>
                          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows="3" style={{ width: '100%', marginBottom: 8 }} />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button type="button" className="save-btn" onClick={() => handleUpdateReview(review.id)}>저장</button>
                            <button type="button" className="cancel-btn" onClick={() => setEditingReviewId(null)}>취소</button>
                          </div>
                        </div>
                      ) : (
                        <p>{getReviewText(review) || '내용 없는 리뷰입니다.'}</p>
                      )}

                      {review.tags?.length > 0 && (
                        <div className="review-tag-list">
                          {review.tags.map((tag) => <span key={tag}>{tag}</span>)}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        {user?.id && review.userId === user.id && editingReviewId !== review.id && (
                          <button type="button" className="edit-btn" onClick={() => { setEditingReviewId(review.id); setEditContent(getReviewText(review)); setEditRating(review.rating || 0); }}>수정</button>
                        )}
                        <button type="button" className="review-delete-btn" onClick={() => handleDeleteReview(review.id)}>삭제</button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="detail-empty-box">아직 등록된 리뷰가 없습니다.</div>
                )}
              </div>

              {highlights.length > 0 && (
                <div className="highlight-list">
                  {highlights.map((highlight) => (
                    <article className="highlight-item" key={highlight.id}>
                      <blockquote>{highlight.quote}</blockquote>
                      {highlight.note && <p>{highlight.note}</p>}
                      <div>
                        {highlight.page && <span>{highlight.page}쪽</span>}
                        {highlight.isSpoiler && <span>스포일러 포함</span>}
                      </div>
                      <button type="button" className="review-delete-btn" style={{ marginTop: 8 }} onClick={() => handleDeleteHighlight(highlight.id)}>삭제</button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>
        </section>
      </div>

      <BookDetailModals
        bookTitle={book.title}
        reviewModalOpen={reviewModalOpen}
        reviewRating={reviewRating}
        setReviewRating={setReviewRating}
        reviewContent={reviewContent}
        setReviewContent={setReviewContent}
        selectedReviewTags={selectedReviewTags}
        onToggleReviewTag={(tag) => setSelectedReviewTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}
        onSubmitReview={handleSubmitReview}
        onCloseReview={() => { setReviewRating(0); setReviewContent(''); setSelectedReviewTags([]); setReviewModalOpen(false); }}
        highlightModalOpen={highlightModalOpen}
        highlightQuote={highlightQuote}
        setHighlightQuote={setHighlightQuote}
        highlightNote={highlightNote}
        setHighlightNote={setHighlightNote}
        highlightPage={highlightPage}
        setHighlightPage={setHighlightPage}
        highlightSpoiler={highlightSpoiler}
        setHighlightSpoiler={setHighlightSpoiler}
        onSubmitHighlight={handleSubmitHighlight}
        onCloseHighlight={() => { setHighlightQuote(''); setHighlightNote(''); setHighlightPage(''); setHighlightSpoiler(false); setHighlightModalOpen(false); }}
      />
    </main>
  );
}

export default BookDetailPage;
