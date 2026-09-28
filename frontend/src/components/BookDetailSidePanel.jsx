import { DEFAULT_POSTER, FALLBACK_COLORS } from '../constants';

export default function BookDetailSidePanel({
  book,
  formData,
  isEditing,
  bookStatus,
  sideMenuOpen,
  setSideMenuOpen,
  statusOptions,
  onStatusChange,
  bookshelves,
  currentShelfId,
  shelfSubMenuOpen,
  setShelfSubMenuOpen,
  onAssignShelf,
  onRemoveFromShelf,
  onOpenHighlight,
  onOpenReview,
  aiApiKey,
  setAiApiKey,
  showAiApiKey,
  setShowAiApiKey,
  aiPosters,
  aiGenerating,
  onAiGenerate,
  onSelectPoster,
  onStartEdit,
  onDelete,
  onSave,
  onCancelEdit,
}) {
  return (
    <aside className="book-side-panel">
      <div className="book-cover-box">
        {formData.poster && formData.poster !== DEFAULT_POSTER ? (
          <img
            src={formData.poster}
            alt={formData.title}
            className="book-poster"
            onError={(e) => { e.currentTarget.src = DEFAULT_POSTER; }}
          />
        ) : (
          <div className={`detail-fallback-cover ${FALLBACK_COLORS[Number(book.id) % FALLBACK_COLORS.length]}`}>
            <span>{book.author || ''}</span>
            <strong>{book.title}</strong>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="edit-ai-cover-section">
          <p className="edit-ai-cover-label">AI 표지 생성</p>

          <div className="edit-ai-key-row">
            <input
              type={showAiApiKey ? 'text' : 'password'}
              value={aiApiKey}
              onChange={(e) => {
                setAiApiKey(e.target.value);
              }}
              placeholder="OpenAI API 키 (sk-...)"
            />
            <button type="button" onClick={() => setShowAiApiKey((p) => !p)}>
              {showAiApiKey ? '숨기기' : '보기'}
            </button>
          </div>

          <button
            type="button"
            className="edit-ai-generate-btn"
            onClick={onAiGenerate}
            disabled={aiGenerating}
          >
            {aiGenerating ? '생성 중...' : '표지 생성'}
          </button>

          {aiPosters.length > 0 && (
            <div className="edit-ai-poster-grid">
              {aiPosters.map((poster, i) => (
                <button
                  type="button"
                  key={i}
                  className={`edit-ai-poster-card ${formData.poster === poster ? 'selected' : ''}`}
                  onClick={() => onSelectPoster(poster)}
                >
                  <img src={poster} alt={`AI 표지 ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="side-menu-area">
        <button
          type="button"
          className="book-status-main-btn"
          onClick={() => setSideMenuOpen((prev) => !prev)}
        >
          <span>{bookStatus || '독서 상태 선택'}</span>
          <em>⌄</em>
        </button>

        {sideMenuOpen && (
          <div className="book-status-dropdown">
            {statusOptions.map((status) => (
              <button
                type="button"
                key={status.label}
                onClick={() => onStatusChange(status.label)}
              >
                <span>{status.icon}</span>
                {status.label}
                <em>{bookStatus === status.label ? '●' : '○'}</em>
              </button>
            ))}

            <div className="book-status-menu-line" />

            <button type="button" onClick={() => setShelfSubMenuOpen((p) => !p)}>
              <span>＋</span>
              {currentShelfId && bookshelves.find((s) => s.id === currentShelfId)
                ? bookshelves.find((s) => s.id === currentShelfId).name
                : '책장에 추가'}
              <strong>{shelfSubMenuOpen ? '↑' : '›'}</strong>
            </button>

            {shelfSubMenuOpen && (
              <div className="book-shelf-submenu">
                {bookshelves.length === 0 ? (
                  <p className="shelf-submenu-empty">서재에 책장이 없습니다</p>
                ) : (
                  bookshelves.map((shelf) => (
                    <button
                      key={shelf.id}
                      type="button"
                      className={currentShelfId === shelf.id ? 'active' : ''}
                      onClick={() => { onAssignShelf(shelf.id); setShelfSubMenuOpen(false); }}
                    >
                      <span>▤</span>
                      {shelf.name}
                      {currentShelfId === shelf.id && <em>●</em>}
                    </button>
                  ))
                )}
                {currentShelfId !== null && bookshelves.length > 0 && (
                  <>
                    <div className="book-status-menu-line" />
                    <button
                      type="button"
                      onClick={() => { onRemoveFromShelf(); setShelfSubMenuOpen(false); }}
                    >
                      <span>×</span>
                      책장에서 제거
                    </button>
                  </>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => { onOpenHighlight(); setSideMenuOpen(false); }}
            >
              <span>✎</span>
              인상 깊은 문장 추가
            </button>

            <button
              type="button"
              onClick={() => { onOpenReview(); setSideMenuOpen(false); }}
            >
              <span>☆</span>
              리뷰 작성
            </button>

          </div>
        )}
      </div>

      <div className="book-link-list">
        <div>
          <span>등록일</span>
          <strong>{book.createdDate || '미등록'}</strong>
        </div>
        <div>
          <span>출판일</span>
          <strong>{book.publishedDate || '미등록'}</strong>
        </div>
        <div>
          <span>수정일</span>
          <strong>{book.modifiedDate || '미수정'}</strong>
        </div>
        <div>
          <span>장르</span>
          <strong>{book.genre || '소설'}</strong>
        </div>
      </div>

      <div className="actions">
        {!isEditing ? (
          <>
            <button className="edit-btn" onClick={onStartEdit}>정보 수정</button>
            <button className="delete-btn" onClick={onDelete}>휴지통 이동</button>
          </>
        ) : (
          <>
            <button className="save-btn" onClick={onSave}>저장하기</button>
            <button className="cancel-btn" onClick={onCancelEdit}>취소</button>
          </>
        )}
      </div>
    </aside>
  );
}
