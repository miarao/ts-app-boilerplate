import { AxiosAPIClient } from 'client'
import { errorPrinter } from 'misc'
import {useEnvVars} from "../context/EnvironmentProvider";

// TODO (om): (migration incompatibility) should be changed as per project requirements
const API_BASE_URL = 'http://localhost:1404'
const apiClient = new AxiosAPIClient(API_BASE_URL)

export interface DocumentSubmitRequest {
  content: string
  format?: 'plain' | 'html' | 'markdown' | 'pdf' | 'docx'
  metadata?: { [key: string]: string }
}

export interface DocumentSubmitResponse {
  id: string
  content: string
  format: string
  segments: DocumentSegment[]
  metadata: { [key: string]: string }
}

export interface DocumentSegment {
  id: string
  documentId: string
  content: string
  startPosition: number
  endPosition: number
  type: 'paragraph' | 'sentence' | 'heading' | 'list-item' | 'table' | 'code-block' | 'quote' | 'other'
  hierarchyLevel?: number
  parentSegmentId?: string
}

/**
 * Submits a document for analysis and returns the segmented result
 */
export async function submitDocument(request: DocumentSubmitRequest): Promise<DocumentSubmitResponse> {
  try {
    return await apiClient.post<DocumentSubmitRequest, DocumentSubmitResponse>('/api/documents/analyze', request)
  } catch (error) {
    errorPrinter('Error submitting document:', error)
    throw new Error('Failed to process document. Please try again later.')
  }
}

/**
 * Retrieves a previously processed document by ID
 */
export async function getDocumentById(id: string): Promise<DocumentSubmitResponse> {
  try {
    return await apiClient.get<DocumentSubmitResponse>(`/api/documents/${id}`)
  } catch (error) {
    errorPrinter('Error retrieving document:', error)
    throw new Error('Failed to retrieve document. Please try again later.')
  }
}
