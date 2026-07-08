import React from 'react';
import { Settings, Trash2 } from 'lucide-react';
import CustomSelect from './CustomSelect';

interface NodeDetailsSidebarProps {
  selectedElement: any;
  onUpdateNode: (nodeId: string, data: any) => void;
  onUpdateEdge: (edgeId: string, condition: any, isLoop: boolean, timeDelay: number, timeout?: number) => void;
  onDeleteElement: (id: string, isNode: boolean) => void;
  onClose: () => void;
}

const NodeDetailsSidebar: React.FC<NodeDetailsSidebarProps> = ({ 
  selectedElement, 
  onUpdateNode, 
  onUpdateEdge, 
  onDeleteElement, 
  onClose 
}) => {
  if (!selectedElement) return null;

  const isNode = selectedElement.position !== undefined;

  const renderNodeEditor = () => {
    const node = selectedElement;
    const { action_type } = node.data;

    if (action_type === 'waypoint') {
      return (
        <div className="details-body">
          <div className="form-group">
            <label>Nút chuyển hướng (Waypoint)</label>
            <div style={{
              padding: '12px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              backgroundColor: '#fffcf9',
              lineHeight: '1.4'
            }}>
              Nút này đóng vai trò trung gian định vị trên Canvas để bẻ cong đường nối vuông góc (SmoothStep), giúp sơ đồ kịch bản không bị chồng chéo. Lõi tự động hóa sẽ đi qua nút này ngay lập tức.
            </div>
          </div>
          
          <button 
            className="btn-danger" 
            onClick={() => {
              onDeleteElement(node.id, true);
            }}
          >
            <Trash2 size={16} />
            <span>Xóa nút chuyển hướng</span>
          </button>
        </div>
      );
    }

    const handleInputChange = (field: string, val: any) => {
      onUpdateNode(node.id, {
        ...node.data,
        [field]: val
      });
    };

    const showSelector = ['click', 'click_checkbox', 'select_option', 'fill_text', 'drag_drop', 'upload_file', 'extract_data'].includes(action_type);
    const showTargetSelector = ['drag_drop'].includes(action_type);
    const showValue = ['new_tab', 'open_tab', 'select_option', 'fill_text', 'upload_file', 'extract_data'].includes(action_type);
    const showScroll = ['scroll'].includes(action_type);

    return (
      <div className="details-body">
        <div className="form-group">
          <label>Loại hành động</label>
          <input type="text" className="form-control" value={action_type} disabled style={{ backgroundColor: '#f4eae1', fontWeight: 600 }} />
        </div>

        {!['close_browser', 'switch_tab', 'close_tab'].includes(action_type) && (
          <div className="form-group">
            <label>Tab thực hiện</label>
            <CustomSelect
              value={node.data.target_tab || 'current'}
              onChange={(val) => handleInputChange('target_tab', val)}
              options={[
                { value: 'current', label: 'Tab hiện tại (current)' },
                { value: 'new', label: 'Mở tab mới (new)' },
                { value: 'tab_0', label: 'Tab 0' },
                { value: 'tab_1', label: 'Tab 1' },
                { value: 'tab_2', label: 'Tab 2' },
                { value: 'tab_3', label: 'Tab 3' },
              ]}
            />
          </div>
        )}

        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', padding: '5px 0' }}>
          <input 
            type="checkbox" 
            id="isStartCheckbox"
            checked={node.data.is_start || false} 
            onChange={(e) => handleInputChange('is_start', e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--color-success)' }}
          />
          <label htmlFor="isStartCheckbox" style={{ cursor: 'pointer', color: 'var(--color-success)', fontWeight: 700 }}>
            Đặt làm nút Bắt đầu (Start Node)
          </label>
        </div>

        {showSelector && (
          <div className="form-group">
            <label>CSS/XPath Selector nguồn</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. button#submit" 
              value={node.data.selector || ''} 
              onChange={(e) => handleInputChange('selector', e.target.value)}
            />
          </div>
        )}

        {showTargetSelector && (
          <div className="form-group">
            <label>CSS/XPath Selector đích (drag-drop)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. div.dropzone" 
              value={node.data.target_selector || ''} 
              onChange={(e) => handleInputChange('target_selector', e.target.value)}
            />
          </div>
        )}

        {action_type === 'extract_data' && (
          <div className="form-group">
            <label>Thuộc tính cần trích xuất</label>
            <CustomSelect
              value={node.data.extra_params?.attribute || 'text'}
              onChange={(val) => {
                const updatedExtra = { ...node.data.extra_params, attribute: val };
                handleInputChange('extra_params', updatedExtra);
              }}
              options={[
                { value: 'text', label: 'Text của element (inner text)' },
                { value: 'value', label: 'Value của element (input value/text)' },
                { value: 'class', label: 'Thuộc tính class' },
                { value: 'href', label: 'Thuộc tính href (URL liên kết)' },
                { value: 'src', label: 'Thuộc tính src (Đường dẫn ảnh/file)' },
                { value: 'placeholder', label: 'Thuộc tính placeholder' },
                { value: 'custom', label: 'Thuộc tính tự do khác...' },
              ]}
            />
            
            {(node.data.extra_params?.attribute === 'custom' || !['text', 'value', 'class', 'href', 'src', 'placeholder'].includes(node.data.extra_params?.attribute || 'text')) && (
              <div style={{ marginTop: '8px' }}>
                <label style={{ fontSize: '0.75rem' }}>Tên thuộc tính tự do</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. data-id hoặc title"
                  value={node.data.extra_params?.custom_attribute || ''}
                  onChange={(e) => {
                    const updatedExtra = { ...node.data.extra_params, custom_attribute: e.target.value };
                    handleInputChange('extra_params', updatedExtra);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {action_type === 'switch_tab' && (
          <div className="form-group">
            <label>Tab cần chuyển tới</label>
            <CustomSelect
              value={['tab_0','tab_1','tab_2','tab_3'].includes(node.data.value) ? node.data.value : (node.data.value ? 'custom' : '')}
              onChange={(val) => {
                if (val === 'custom') {
                  handleInputChange('value', '');
                } else {
                  handleInputChange('value', val);
                }
              }}
              options={[
                { value: '', label: '-- Chọn tab --' },
                { value: 'tab_0', label: 'Tab 0' },
                { value: 'tab_1', label: 'Tab 1' },
                { value: 'tab_2', label: 'Tab 2' },
                { value: 'tab_3', label: 'Tab 3' },
                { value: 'custom', label: 'Nhập biến / chỉ số tự do...' },
              ]}
            />
            
            {(node.data.value !== undefined && node.data.value !== null && node.data.value !== '' && !['tab_0', 'tab_1', 'tab_2', 'tab_3'].includes(node.data.value)) && (
              <div style={{ marginTop: '8px' }}>
                <label style={{ fontSize: '0.75rem' }}>Định danh tab tự do (hoặc chỉ số, hoặc biến {"{{BIEN}}"})</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 1 hoặc {{MY_TAB_NAME}}"
                  value={node.data.value || ''}
                  onChange={(e) => handleInputChange('value', e.target.value)}
                />
              </div>
            )}
            {(!node.data.value) && (
              <div style={{ marginTop: '8px' }}>
                <label style={{ fontSize: '0.75rem' }}>Nhập định danh tự do</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. tab_0 hoặc {{MY_TAB}}"
                  value={node.data.value || ''}
                  onChange={(e) => handleInputChange('value', e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {action_type === 'close_tab' && (
          <div className="form-group">
            <label>Tab cần đóng</label>
            <CustomSelect
              value={node.data.value === undefined || node.data.value === null || node.data.value === '' ? 'current' : (['tab_0','tab_1','tab_2','tab_3'].includes(node.data.value) ? node.data.value : 'custom')}
              onChange={(val) => {
                if (val === 'current') {
                  handleInputChange('value', '');
                } else if (val === 'custom') {
                  handleInputChange('value', '');
                } else {
                  handleInputChange('value', val);
                }
              }}
              options={[
                { value: 'current', label: 'Tab hiện tại (current)' },
                { value: 'tab_0', label: 'Tab 0' },
                { value: 'tab_1', label: 'Tab 1' },
                { value: 'tab_2', label: 'Tab 2' },
                { value: 'tab_3', label: 'Tab 3' },
                { value: 'custom', label: 'Nhập biến tự do...' },
              ]}
            />
            
            {node.data.value !== '' && node.data.value !== undefined && node.data.value !== null && (!['tab_0', 'tab_1', 'tab_2', 'tab_3'].includes(node.data.value)) && (
              <div style={{ marginTop: '8px' }}>
                <label style={{ fontSize: '0.75rem' }}>Định danh tab hoặc biến {"{{BIEN}}"}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. {{TAB_TO_CLOSE}}"
                  value={node.data.value || ''}
                  onChange={(e) => handleInputChange('value', e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {['fill_text', 'select_option'].includes(action_type) && (
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', padding: '5px 0' }}>
            <input 
              type="checkbox" 
              id="isRandomCheckbox"
              checked={node.data.is_random || false} 
              onChange={(e) => handleInputChange('is_random', e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
            />
            <label htmlFor="isRandomCheckbox" style={{ cursor: 'pointer', fontWeight: 600 }}>
              Ngẫu nhiên giá trị (Randomize value)
            </label>
          </div>
        )}

        {showValue && (!node.data.is_random) && (
          <div className="form-group">
            <label>
              {action_type === 'extract_data' 
                ? 'Tên biến môi trường lưu trữ (e.g. OTP_CODE)' 
                : 'Giá trị (URL, Text, Index...)'}
            </label>
            <textarea 
              className="form-control" 
              rows={action_type === 'extract_data' ? 1 : 3}
              placeholder={
                action_type === 'extract_data'
                ? "Nhập tên biến để sử dụng ở các bước sau qua cú pháp {{TÊN_BIẾN}}..."
                : action_type.includes('tab') 
                  ? "Nhập URL ví dụ: https://nowsecure.nl" 
                  : "Nhập nội dung cần điền hoặc giá trị option..."
              }
              value={node.data.value || ''} 
              onChange={(e) => handleInputChange('value', e.target.value)}
            />
          </div>
        )}

        {action_type === 'fill_text' && node.data.is_random && (
          <div className="form-group">
            <label>Loại ngẫu nhiên</label>
            <CustomSelect
              value={node.data.random_type || 'text'}
              onChange={(val) => handleInputChange('random_type', val)}
              options={[
                { value: 'text', label: 'Chữ (Text)' },
                { value: 'number', label: 'Số (Number)' },
                { value: 'date', label: 'Ngày tháng (Date)' },
                { value: 'name', label: 'Tên (Name)' },
                { value: 'firstname', label: 'Tên gọi (First Name)' },
                { value: 'lastname', label: 'Họ (Last Name)' },
                { value: 'email', label: 'Email' },
              ]}
            />
          </div>
        )}

        {['fill_text', 'select_option'].includes(action_type) && node.data.is_random && (() => {
          const randType = node.data.random_type || 'text';
          if (action_type === 'fill_text' && ['name', 'firstname', 'lastname', 'email'].includes(randType)) {
            return null;
          }

          let minLabel = 'Index nhỏ nhất';
          let maxLabel = 'Index lớn nhất';
          let minPlaceholder = 'e.g. 0';
          let maxPlaceholder = 'e.g. 5';

          if (action_type === 'fill_text') {
            if (randType === 'number') {
              minLabel = 'Giá trị nhỏ nhất';
              maxLabel = 'Giá trị lớn nhất';
              minPlaceholder = 'e.g. 1';
              maxPlaceholder = 'e.g. 100';
            } else if (randType === 'date') {
              minLabel = 'Ngày nhỏ nhất (Offset ngày / Timestamp)';
              maxLabel = 'Ngày lớn nhất (Offset ngày / Timestamp)';
              minPlaceholder = 'e.g. -30 (30 ngày trước)';
              maxPlaceholder = 'e.g. 30 (30 ngày sau)';
            } else {
              minLabel = 'Độ dài nhỏ nhất';
              maxLabel = 'Độ dài lớn nhất';
              minPlaceholder = 'e.g. 1';
              maxPlaceholder = 'e.g. 10';
            }
          }

          return (
            <div className="form-row">
              <div className="form-group">
                <label>{minLabel}</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder={minPlaceholder}
                  value={node.data.min_val !== undefined && node.data.min_val !== null ? node.data.min_val : ''} 
                  onChange={(e) => handleInputChange('min_val', e.target.value === '' ? null : (parseInt(e.target.value) || 0))}
                />
              </div>
              <div className="form-group">
                <label>{maxLabel}</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder={maxPlaceholder}
                  value={node.data.max_val !== undefined && node.data.max_val !== null ? node.data.max_val : ''} 
                  onChange={(e) => handleInputChange('max_val', e.target.value === '' ? null : (parseInt(e.target.value) || 0))}
                />
              </div>
            </div>
          );
        })()}

        {showScroll && (
          <div className="form-row">
            <div className="form-group">
              <label>Cuộn X (Ngang)</label>
              <input 
                type="number" 
                className="form-control" 
                value={node.data.scroll_x || 0} 
                onChange={(e) => handleInputChange('scroll_x', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label>Cuộn Y (Dọc)</label>
              <input 
                type="number" 
                className="form-control" 
                value={node.data.scroll_y || 0} 
                onChange={(e) => handleInputChange('scroll_y', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        )}

        <button 
          className="btn-danger" 
          onClick={() => {
            onDeleteElement(node.id, true);
          }}
        >
          <Trash2 size={16} />
          <span>Xóa hành động</span>
        </button>
      </div>
    );
  };

  const renderEdgeEditor = () => {
    const edge = selectedElement;

    const getConditionObj = (condValue: any) => {
      if (!condValue) return { logical_operator: 'AND', rules: [] };
      if (typeof condValue === 'object') {
        return {
          logical_operator: condValue.logical_operator || 'AND',
          rules: condValue.rules || []
        };
      }
      try {
        const parsed = JSON.parse(condValue);
        if (parsed && typeof parsed === 'object') {
          return {
            logical_operator: parsed.logical_operator || 'AND',
            rules: parsed.rules || []
          };
        }
      } catch (e) {}
      if (typeof condValue === 'string' && condValue.trim() !== '') {
        return {
          logical_operator: 'AND',
          rules: [{ selector: '', attribute: 'text', comparison: 'eq', value: condValue }]
        };
      }
      return { logical_operator: 'AND', rules: [] };
    };

    const condObj = getConditionObj(edge.data?.condition);

    const handleLogicalOperatorChange = (op: string) => {
      const updated = { ...condObj, logical_operator: op };
      onUpdateEdge(edge.id, updated, edge.data?.is_loop, edge.data?.time_delay || 0.0, edge.data?.timeout !== undefined ? edge.data.timeout : 3);
    };

    const handleRuleChange = (index: number, field: string, value: any) => {
      const updatedRules = condObj.rules.map((rule: any, idx: number) => {
        if (idx === index) {
          const newRule = { ...rule, [field]: value };
          if (field === 'attribute' && (value === 'url' || value === 'content')) {
            newRule.selector = '';
          }
          return newRule;
        }
        return rule;
      });
      const updated = { ...condObj, rules: updatedRules };
      onUpdateEdge(edge.id, updated, edge.data?.is_loop, edge.data?.time_delay || 0.0, edge.data?.timeout !== undefined ? edge.data.timeout : 3);
    };

    const handleAddRule = () => {
      const newRule = { selector: '', attribute: 'text', comparison: 'eq', value: '' };
      const updated = { ...condObj, rules: [...condObj.rules, newRule] };
      onUpdateEdge(edge.id, updated, edge.data?.is_loop, edge.data?.time_delay || 0.0, edge.data?.timeout !== undefined ? edge.data.timeout : 3);
    };

    const handleRemoveRule = (index: number) => {
      const updatedRules = condObj.rules.filter((_: any, idx: number) => idx !== index);
      const updated = { ...condObj, rules: updatedRules };
      onUpdateEdge(edge.id, updated, edge.data?.is_loop, edge.data?.time_delay || 0.0, edge.data?.timeout !== undefined ? edge.data.timeout : 3);
    };

    return (
      <div className="details-body" style={{ gap: '15px' }}>
        <div className="form-group">
          <label>Toán tử logic liên kết</label>
          <CustomSelect
            value={condObj.logical_operator}
            onChange={(val) => handleLogicalOperatorChange(val)}
            options={[
              { value: 'AND', label: 'VÀ (Tất cả điều kiện phải khớp)' },
              { value: 'OR', label: 'HOẶC (Chỉ cần 1 điều kiện khớp)' },
            ]}
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Các quy tắc điều kiện ({condObj.rules.length})</span>
            <button 
              type="button" 
              onClick={handleAddRule}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-accent-hover)',
                cursor: 'pointer'
              }}
            >
              + Thêm quy tắc
            </button>
          </label>
          
          {condObj.rules.length === 0 ? (
            <div style={{
              padding: '12px',
              border: '1px dashed var(--border-color)',
              borderRadius: '6px',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              backgroundColor: '#fffcf9'
            }}>
              Không có điều kiện cài đặt (Kịch bản mặc định chạy qua nhánh này)
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '5px' }}>
              {condObj.rules.map((rule: any, index: number) => {
                const needsSelector = rule.attribute !== 'url' && rule.attribute !== 'content';
                const isCustomAttr = rule.attribute === 'custom';
                
                return (
                  <div 
                    key={index} 
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '10px',
                      backgroundColor: '#fffcf9',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      position: 'relative'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(index)}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-error)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                      title="Xóa quy tắc này"
                    >
                      ✕
                    </button>

                    <div className="form-group" style={{ gap: '3px' }}>
                      <label style={{ fontSize: '0.7rem' }}>Thuộc tính cần kiểm tra</label>
                      <CustomSelect
                        value={rule.attribute}
                        onChange={(val) => handleRuleChange(index, 'attribute', val)}
                        options={[
                          { value: 'text', label: 'Text của element (inner text)' },
                          { value: 'value', label: 'Value của element (input value)' },
                          { value: 'url', label: 'Đường dẫn trang (URL)' },
                          { value: 'content', label: 'HTML toàn trang (content)' },
                          { value: 'custom', label: 'Thuộc tính tùy do (custom attribute)...' },
                        ]}
                      />
                    </div>

                    {isCustomAttr && (
                      <div className="form-group" style={{ gap: '3px' }}>
                        <label style={{ fontSize: '0.7rem' }}>Tên thuộc tính (e.g. placeholder, href, class)</label>
                        <input
                          type="text"
                          className="form-control"
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          placeholder="e.g. disabled hoặc placeholder"
                          value={rule.custom_attribute || ''}
                          onChange={(e) => handleRuleChange(index, 'custom_attribute', e.target.value)}
                        />
                      </div>
                    )}

                    {needsSelector && (
                      <div className="form-group" style={{ gap: '3px' }}>
                        <label style={{ fontSize: '0.7rem' }}>CSS/XPath Selector của element</label>
                        <input
                          type="text"
                          className="form-control"
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          placeholder="e.g. div.success-msg"
                          value={rule.selector || ''}
                          onChange={(e) => handleRuleChange(index, 'selector', e.target.value)}
                        />
                      </div>
                    )}

                    <div className="form-group" style={{ gap: '3px' }}>
                      <label style={{ fontSize: '0.7rem' }}>Phép toán so sánh</label>
                      <CustomSelect
                        value={rule.comparison}
                        onChange={(val) => handleRuleChange(index, 'comparison', val)}
                        options={[
                          { value: 'eq', label: 'Giống (Bằng)' },
                          { value: 'neq', label: 'Không giống (Khác)' },
                          { value: 'contains', label: 'Chứa' },
                          { value: 'not_contains', label: 'Không chứa' },
                          { value: 'gt', label: 'Lớn hơn (>)' },
                          { value: 'lt', label: 'Nhỏ hơn (<)' },
                        ]}
                      />
                    </div>

                    <div className="form-group" style={{ gap: '3px' }}>
                      <label style={{ fontSize: '0.7rem' }}>Giá trị đối chiếu</label>
                      <input
                        type="text"
                        className="form-control"
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        placeholder="Nhập giá trị mong muốn..."
                        value={rule.value || ''}
                        onChange={(e) => handleRuleChange(index, 'value', e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', padding: '5px 0' }}>
          <input 
            type="checkbox" 
            id="isLoopCheckbox"
            checked={edge.data?.is_loop || false} 
            onChange={(e) => onUpdateEdge(edge.id, edge.data?.condition || '', e.target.checked, edge.data?.time_delay || 0.0, edge.data?.timeout !== undefined ? edge.data.timeout : 3)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--color-loop)' }}
          />
          <label htmlFor="isLoopCheckbox" style={{ cursor: 'pointer', color: 'var(--color-loop)', fontWeight: 700 }}>
            Thiết lập làm Vòng lặp (Loop Edge)
          </label>
        </div>

        <div className="form-group">
          <label>Thời gian chờ trễ (giây)</label>
          <input 
            type="number" 
            step="0.5"
            min="0"
            className="form-control" 
            placeholder="e.g. 0 hoặc 3.5" 
            value={edge.data?.time_delay || 0} 
            onChange={(e) => onUpdateEdge(edge.id, edge.data?.condition || '', edge.data?.is_loop, parseFloat(e.target.value) || 0.0, edge.data?.timeout !== undefined ? edge.data.timeout : 3)}
          />
        </div>

        <div className="form-group">
          <label>Thời gian chờ tối đa selector (Timeout giây)</label>
          <input 
            type="number" 
            min="0"
            className="form-control" 
            placeholder="Mặc định: 3 giây" 
            value={edge.data?.timeout !== undefined ? edge.data.timeout : 3} 
            onChange={(e) => onUpdateEdge(edge.id, edge.data?.condition || '', edge.data?.is_loop, edge.data?.time_delay || 0.0, parseInt(e.target.value) || 0)}
          />
        </div>

        <button 
          className="btn-danger" 
          onClick={() => {
            onDeleteElement(edge.id, false);
          }}
        >
          <Trash2 size={16} />
          <span>Xóa đường nối</span>
        </button>
      </div>
    );
  };

  return (
    <div className="details-sidebar">
      <div className="details-header">
        <h3>
          <Settings size={18} />
          <span>Cấu hình {isNode ? 'Hành động' : 'Liên kết'}</span>
        </h3>
        <button className="details-close-btn" onClick={onClose}>
          ✕
        </button>
      </div>
      {isNode ? renderNodeEditor() : renderEdgeEditor()}
    </div>
  );
};

export default NodeDetailsSidebar;
