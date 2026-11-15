import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNextMaintenanceDate,
  getMaintenanceStatus,
  applyStockTransaction,
  calculateMeterConsumption,
} from './cmmsLogic';
import { resolveImageUrl, isDirectUploadedImage } from './imageUtils';

test('calculateNextMaintenanceDate adds proper interval for frequencies', () => {
  // Daily
  assert.equal(calculateNextMaintenanceDate('2026-11-10', 'Daily'), '2026-11-11');
  // Weekly
  assert.equal(calculateNextMaintenanceDate('2026-11-10', 'Weekly'), '2026-11-17');
  // Monthly
  assert.equal(calculateNextMaintenanceDate('2026-11-10', 'Monthly'), '2026-12-10');
  // Quarterly
  assert.equal(calculateNextMaintenanceDate('2026-11-10', 'Quarterly'), '2027-02-10');
  // Yearly
  assert.equal(calculateNextMaintenanceDate('2026-11-10', 'Yearly'), '2027-11-10');
});

test('getMaintenanceStatus detects overdue, due today, upcoming, and normal correctly', () => {
  const refDate = '2026-11-10';

  assert.equal(getMaintenanceStatus('2026-11-05', refDate), 'Quá hạn');
  assert.equal(getMaintenanceStatus('2026-11-10', refDate), 'Tới hạn');
  assert.equal(getMaintenanceStatus('2026-11-14', refDate), 'Sắp tới');
  assert.equal(getMaintenanceStatus('2026-11-30', refDate), 'Đúng hạn');
});

test('applyStockTransaction properly deducts and increments stock', () => {
  // Issue stock
  assert.equal(applyStockTransaction(10, 'Xuất kho sử dụng', 3), 7);
  // Clamps to 0 when overdrawn
  assert.equal(applyStockTransaction(2, 'Xuất kho sử dụng', 5), 0);
  // Restock
  assert.equal(applyStockTransaction(10, 'Nhập kho', 15), 25);
  // Return to stock
  assert.equal(applyStockTransaction(10, 'Hoàn kho', 2), 12);
});

test('calculateMeterConsumption computes delta accurately and non-negative', () => {
  assert.equal(calculateMeterConsumption(1000, 1450), 450);
  assert.equal(calculateMeterConsumption(500, 500), 0);
  assert.equal(calculateMeterConsumption(500, 400), 0);
});

test('resolveImageUrl correctly parses Google Drive thumbnail and view links', () => {
  const thumbnailLink = 'https://drive.google.com/thumbnail?id=1BClKVnAj1bd9yvWVJMuYSamLlPSCt-nj&sz=w1000';
  assert.equal(
    resolveImageUrl(thumbnailLink),
    'https://lh3.googleusercontent.com/d/1BClKVnAj1bd9yvWVJMuYSamLlPSCt-nj=w1000'
  );

  const fileLink = 'https://drive.google.com/file/d/1BClKVnAj1bd9yvWVJMuYSamLlPSCt-nj/view';
  assert.equal(
    resolveImageUrl(fileLink),
    'https://lh3.googleusercontent.com/d/1BClKVnAj1bd9yvWVJMuYSamLlPSCt-nj=w1000'
  );

  const directLink = 'https://images.unsplash.com/photo-1581092160607';
  assert.equal(resolveImageUrl(directLink), directLink);
});

test('isDirectUploadedImage accurately identifies real factory photos', () => {
  assert.equal(
    isDirectUploadedImage('https://drive.google.com/thumbnail?id=1BClKVnAj1bd9yvWVJMuYSamLlPSCt-nj&sz=w1000'),
    true
  );
  assert.equal(
    isDirectUploadedImage('https://lh3.googleusercontent.com/d/1BClKVnAj1bd9yvWVJMuYSamLlPSCt-nj=w1000'),
    true
  );
  assert.equal(
    isDirectUploadedImage('https://images.unsplash.com/photo-1581092160607'),
    false
  );
});
