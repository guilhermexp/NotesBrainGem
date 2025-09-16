/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {LitElement, css, html, svg} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {repeat} from 'lit/directives/repeat.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';
import {marked} from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import type {ChatMessage} from '../types/types';

@customElement('gdm-chat-panel')
export class GdmChatPanel extends LitElement {
  @property({type: Array}) chatHistory: ChatMessage[] = [];
  @property({type: Boolean}) isChatting = false;
  @query('.message-list') private messageList: HTMLUListElement | undefined;
  @query('textarea') private textarea: HTMLTextAreaElement | undefined;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .message-list {
      flex-grow: 1;
      overflow-y: auto;
      padding: 16px 8px;
      list-style: none;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message {
      display: flex;
      gap: 12px;
      max-width: 85%;
    }

    .message.user {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .message.model {
      align-self: flex-start;
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #444;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .message-content {
      background: #3c3c3c;
      padding: 1px 14px;
      border-radius: 18px;
      color: #e0e0e0;
      line-height: 1.6;
      font-size: 14px;
      overflow-wrap: break-word;
      word-break: break-word;
    }

    .message.user .message-content {
      background: #5078ff;
      color: white;
    }

    /* Markdown support */
    .message-content > *:first-child {
      margin-top: 10px;
    }
    .message-content > *:last-child {
      margin-bottom: 10px;
    }
    .message-content a {
      color: #8ab4f8;
      text-decoration: none;
    }
    .message-content a:hover {
      text-decoration: underline;
    }
    .message-content ul,
    .message-content ol {
      padding-left: 20px;
    }
    .message-content code:not(.hljs) {
      /* Inline code */
      background: rgba(0, 0, 0, 0.3);
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 0.9em;
    }
    .message-content blockquote {
      margin: 1em 0;
      padding-left: 1em;
      border-left: 3px solid #5078ff;
      color: #ccc;
      font-style: italic;
    }
    .message-content hr {
      border: none;
      border-top: 1px solid #555;
      margin: 1em 0;
    }

    /* Table Styles */
    .table-wrapper {
      margin: 1em 0;
      overflow-x: auto;
      border: 1px solid #555;
      border-radius: 8px;
    }
    .message-content table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9em;
    }
    .message-content th,
    .message-content td {
      padding: 8px 12px;
      border: 1px solid #555;
      text-align: left;
    }
    .message-content th {
      background-color: #4a4a4a;
    }
    .message-content tr:nth-child(even) {
      background-color: #404040;
    }

    /* Code Block Styles */
    .code-block-wrapper {
      margin: 1em -14px; /* Break out of padding */
      border-radius: 18px;
      overflow: hidden;
      border: 1px solid #555;
    }
    .code-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1e1e26;
      padding: 6px 12px;
      color: #aaa;
      font-size: 12px;
    }
    .lang-name {
      text-transform: lowercase;
      font-family: monospace;
    }
    .copy-code-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #3a3f4c;
      border: none;
      color: #eee;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background-color 0.2s;
    }
    .copy-code-btn:hover {
      background: #4a4f5c;
    }
    .copy-code-btn svg {
      width: 14px;
      height: 14px;
    }
    .message-content pre {
      margin: 0;
      padding: 16px;
      overflow-x: auto;
      background-color: #282c34; /* Atom One Dark background */
    }
    .message-content pre code.hljs {
      padding: 0;
      background: none;
    }

    .image-gallery {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    .image-container {
      position: relative;
      flex-grow: 1;
      min-width: 100px;
    }
    .generated-image {
      max-width: 100%;
      max-height: 200px;
      border-radius: 12px;
      display: block;
      object-fit: cover;
      width: 100%;
    }
    .image-actions {
      position: absolute;
      bottom: 8px;
      right: 8px;
      display: flex;
      gap: 6px;
      background-color: rgba(0, 0, 0, 0.6);
      padding: 6px;
      border-radius: 20px;
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    }
    .image-container:hover .image-actions {
      opacity: 1;
    }
    .action-button {
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    }
    .action-button:hover {
      background: rgba(255, 255, 255, 0.4);
    }
    .skeleton-gallery {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .skeleton-loader {
      background-color: #4a4a4a;
      border-radius: 12px;
      position: relative;
      overflow: hidden;
      height: 150px;
      flex: 1 1 150px;
    }

    .skeleton-loader::after {
      content: '';
      position: absolute;
      top: 0;
      left: -150%;
      width: 150%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent
      );
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      100% {
        left: 150%;
      }
    }

    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
    }
    .typing-indicator span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #777;
      animation: bounce 1.4s infinite ease-in-out both;
    }
    .typing-indicator span:nth-child(1) {
      animation-delay: -0.32s;
    }
    .typing-indicator span:nth-child(2) {
      animation-delay: -0.16s;
    }
    @keyframes bounce {
      0%,
      80%,
      100% {
        transform: scale(0);
      }
      40% {
        transform: scale(1);
      }
    }

    .chat-input-form {
      flex-shrink: 0;
      display: flex;
      gap: 8px;
      padding: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    textarea {
      flex-grow: 1;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 18px;
      color: #eee;
      padding: 10px 16px;
      font-family: inherit;
      font-size: 14px;
      resize: none;
      line-height: 1.5;
      max-height: 150px;
      outline: none;
      transition: border-color 0.2s;
    }
    textarea:focus {
      border-color: #5078ff;
    }
    .send-button {
      flex-shrink: 0;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #5078ff;
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    }
    .send-button:hover:not(:disabled) {
      background: #6a8dff;
    }
    .send-button:disabled {
      background: #444;
      cursor: not-allowed;
    }
  `;

  constructor() {
    super();
    this.setupMarkedRenderer();
  }

  private setupMarkedRenderer() {
    const renderer = new marked.Renderer();

    // fix(chat-panel): Update renderer.code signature to match newer marked API.
    renderer.code = (code: string, infostring: string | undefined) => {
      const lang = infostring?.match(/\S*/)?.[0] || 'plaintext';
      const highlightedCode = hljs.getLanguage(lang)
        ? hljs.highlight(code, {language: lang, ignoreIllegals: true}).value
        : hljs.highlightAuto(code).value;

      const uniqueId = `code-${Math.random().toString(16).slice(2)}`;
      // fix(chat-panel): Replace svg template literal and .getHTML() with a plain string.
      const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="14px" viewBox="0 -960 960 960" width="14px" fill="currentColor"><path d="M320-240q-33 0-56.5-23.5T240-320v-480q0-33 23.5-56.5T320-880h480q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H320Zm0-80h480v-480H320v480ZM160-80q-33 0-56.5-23.5T80-160v-560h80v560h560v80H160Zm160-720v480-480Z"/></svg>`;

      return `
        <div class="code-block-wrapper">
          <div class="code-header">
            <span class="lang-name">${lang}</span>
            <button class="copy-code-btn" data-target-id="${uniqueId}">
              ${copyIcon}
              <span>Copiar</span>
            </button>
          </div>
          <pre><code id="${uniqueId}" class="hljs ${lang}">${highlightedCode}</code></pre>
        </div>
      `;
    };

    // fix(chat-panel): Update renderer.table signature to match newer marked API.
    (renderer as any).table = (header: string, body: string) => {
      return `<div class="table-wrapper"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
    };

    marked.use({
      renderer,
      gfm: true,
      breaks: true,
      headerIds: false,
    });
  }

  async updated() {
    await this.updateComplete;
    if (this.messageList) {
      this.messageList.scrollTop = this.messageList.scrollHeight;
    }
    if (this.textarea) {
      this.textarea.style.height = 'auto';
      this.textarea.style.height = `${this.textarea.scrollHeight}px`;
    }
  }

  private async handleMessageListClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const button = target.closest('.copy-code-btn');

    if (button) {
      const targetId = button.getAttribute('data-target-id');
      const codeElement = this.shadowRoot?.querySelector(`#${targetId}`);
      if (codeElement) {
        await navigator.clipboard.writeText(codeElement.textContent || '');
        const textSpan = button.querySelector('span');
        if (textSpan) {
          textSpan.textContent = 'Copiado!';
          setTimeout(() => {
            textSpan.textContent = 'Copiar';
          }, 2000);
        }
      }
    }
  }

  private handleFormSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!this.textarea) return;
    const message = this.textarea.value.trim();
    if (message && !this.isChatting) {
      this.dispatchEvent(
        new CustomEvent('send-text-message', {
          detail: {message},
          bubbles: true,
          composed: true,
        }),
      );
      this.textarea.value = '';
      this.textarea.style.height = 'auto'; // Reset height after sending
    }
  }

  private handleTextareaKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleFormSubmit(new SubmitEvent('submit'));
    }
  }

  private downloadImage(url: string) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  private insertImageInAnalysis(imageUrl: string) {
    this.dispatchEvent(
      new CustomEvent('insert-image-in-analysis', {
        detail: {imageUrl},
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <ul class="message-list" @click=${this.handleMessageListClick}>
        ${repeat(
          this.chatHistory,
          (message, index) => `${message.role}-${index}`,
          (message) => html`
            <li class="message ${message.role}">
              <div class="avatar">
                ${message.role === 'model' ? '✨' : '👤'}
              </div>
              <div class="message-content">
                ${unsafeHTML(
                  DOMPurify.sanitize(marked.parse(message.text) as string),
                )}
                ${message.imageUrls && message.imageUrls.length > 0
                  ? html`
                      <div class="image-gallery">
                        ${message.imageUrls.map(
                          (url) => html`
                            <div class="image-container">
                              <img
                                class="generated-image"
                                src=${url}
                                alt="Imagem gerada pela IA" />
                              <div class="image-actions">
                                <button
                                  class="action-button"
                                  title="Baixar Imagem"
                                  @click=${() => this.downloadImage(url)}>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="18px"
                                    viewBox="0 -960 960 960"
                                    width="18px"
                                    fill="currentColor">
                                    <path
                                      d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" />
                                  </svg>
                                </button>
                                <button
                                  class="action-button"
                                  title="Inserir na Análise"
                                  @click=${() =>
                                    this.insertImageInAnalysis(url)}>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="18px"
                                    viewBox="0 -960 960 960"
                                    width="18px"
                                    fill="currentColor">
                                    <path
                                      d="M440-280h80v-160h160v-80H520v-160h-80v160H280v80h160v160Zm40 200q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          `,
                        )}
                      </div>
                    `
                  : ''}
                ${message.isLoadingImages
                  ? html`
                      <div class="skeleton-gallery">
                        ${Array(message.imageCount || 1)
                          .fill(0)
                          .map(
                            () => html` <div class="skeleton-loader"></div>`,
                          )}
                      </div>
                    `
                  : ''}
              </div>
            </li>
          `,
        )}
        ${this.isChatting &&
        !this.chatHistory[this.chatHistory.length - 1]?.text.trim()
          ? html`
              <li class="message model">
                <div class="avatar">✨</div>
                <div class="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </li>
            `
          : ''}
      </ul>

      <form class="chat-input-form" @submit=${this.handleFormSubmit}>
        <textarea
          placeholder="Digite sua mensagem..."
          rows="1"
          @input=${() => this.requestUpdate()}
          @keydown=${this.handleTextareaKeydown}
          ?disabled=${this.isChatting}></textarea>
        <button
          type="submit"
          class="send-button"
          ?disabled=${this.isChatting}
          aria-label="Enviar mensagem">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="20px"
            viewBox="0 -960 960 960"
            width="20px"
            fill="currentColor">
            <path d="M120-160v-240l320-80-320-80v-240l760 320-760 320Z" />
          </svg>
        </button>
      </form>
    `;
  }
}
