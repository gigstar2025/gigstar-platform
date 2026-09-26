import { test } from 'node:test'
import assert from 'node:assert/strict'
import { describeStorageUploadError } from './upload-error.ts'

test('RLS violation message is classified as permission', () => {
  const r = describeStorageUploadError({
    message: 'new row violates row-level security policy for table "objects"',
  })
  assert.equal(r.kind, 'permission')
  assert.match(r.message, /permission to edit this profile/)
})

test('403 status is classified as permission', () => {
  const r = describeStorageUploadError({ message: 'Forbidden', statusCode: '403' })
  assert.equal(r.kind, 'permission')
})

test('401 status is classified as permission', () => {
  const r = describeStorageUploadError({ message: 'Unauthorized', status: 401 })
  assert.equal(r.kind, 'permission')
})

test('missing bucket is classified as config, not permission', () => {
  const r = describeStorageUploadError({ message: 'Bucket not found', statusCode: '404' })
  assert.equal(r.kind, 'missing_bucket')
  assert.doesNotMatch(r.message, /permission/)
})

test('object conflict is classified as conflict, not permission', () => {
  const r = describeStorageUploadError({ message: 'The resource already exists', statusCode: '409' })
  assert.equal(r.kind, 'conflict')
  assert.doesNotMatch(r.message, /permission/)
})

test('unknown error surfaces the raw reason instead of a false permission claim', () => {
  const r = describeStorageUploadError({ message: 'network timeout while uploading' })
  assert.equal(r.kind, 'unknown')
  assert.match(r.message, /network timeout/)
  assert.doesNotMatch(r.message, /permission/)
})

test('empty/undefined error falls back to a generic retry message', () => {
  assert.equal(describeStorageUploadError(undefined).kind, 'unknown')
  assert.equal(describeStorageUploadError(null).message, 'Upload failed. Please try again.')
  assert.equal(describeStorageUploadError({}).message, 'Upload failed. Please try again.')
})
