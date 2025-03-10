/**
 * # Index Controller
 * @description This is the controller for the Index view. It receives the model from the Index Route and filters the data according to the selected date bound (this.currentBound). It also controls the display (this.showTable) and which data to display (this.dataToShow). It renders home-page components.
 * @author Tim Leonard <tleonard@21pstem.org>
 * @since 3.1.0
 */

import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class IndexController extends Controller {
  @tracked dataToShow = 'workspace';
  @tracked currentBound = 'oneWeek';
  @tracked showTable = true;
  @tracked selectedData = this.data[0].details;
  @tracked activeDetailTab = 'Mine';
  dateBounds = {
    oneWeek: new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate() - 7
    ),
    oneMonth: new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 1,
      new Date().getDate()
    ),
    sixMonths: new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 6,
      new Date().getDate()
    ),
    schoolYear:
      new Date().getMonth() > 7
        ? new Date(new Date().getFullYear(), 7)
        : new Date(new Date().getFullYear() - 1, 7),
    allTime: new Date(2012),
  };
  // updates when user changes tabs, gets sent to table
  get tableColumns() {
    if (this.dataToShow === 'workspace') {
      return [
        { name: 'Workspace', valuePath: 'name' },
        { name: 'Owner', valuePath: 'owner.username' },
        { name: 'Submissions', valuePath: 'submissionsLength' },
        { name: 'Selections', valuePath: 'selectionsLength' },
        { name: 'Comments', valuePath: 'commentsLength' },
        { name: 'Last Updated', valuePath: 'lastModifiedDate' },
      ];
    }
    if (this.dataToShow === 'assignment') {
      return [
        { name: 'Assignment', valuePath: 'name' },
        { name: 'Section', valuePath: 'section.name' },
        { name: 'Problem', valuePath: 'problem.title' },
        { name: 'Assigned', valuePath: 'assignedDate' },
        { name: 'Due', valuePath: 'dueDate' },
      ];
    }
    if (this.dataToShow === 'feedback') {
      return [
        { name: 'Workspace', valuePath: 'workspaceName' },
        { name: 'Latest Feedback', valuePath: 'latestReply.createDate' },
        { name: 'Latest Revision', valuePath: 'latestRevision.createDate' },
        {
          name: `${this.activeDetailTab === 'Given' ? 'Student' : 'Mentor'}`,
          valuePath: `${
            this.activeDetailTab === 'Given'
              ? 'studentDisplay'
              : 'mentorDisplay'
          }`,
        },
        { name: 'Status', valuePath: 'statusMessage' },
      ];
    }
    //getter must return a value
    return [];
  }
  // updates when user changes tabs and gets sent to table
  // processes user's information into Ember Data format
  get data() {
    if (this.dataToShow === 'workspace') {
      return [
        {
          type: 'workspace',
          label: 'Mine',
          details: this.model.workspaces
            .toArray()
            .filter(
              (workspace) =>
                workspace.lastModifiedDate.getTime() >
                this.dateBounds[this.currentBound].getTime()
            ),
        },
        {
          type: 'workspace',
          label: 'Shared',
          details: this.model.collabWorkspaces
            .toArray()
            .filter(
              (workspace) =>
                workspace.lastModifiedDate.getTime() >
                this.dateBounds[this.currentBound].getTime()
            ),
        },
        {
          type: 'workspace',
          label: 'Created by me',
          details: this.model.createdWorkspaces
            .toArray()
            .filter(
              (workspace) =>
                workspace.lastModifiedDate.getTime() >
                  this.dateBounds[this.currentBound].getTime() &&
                workspace.get('owner.id') !== this.model.user.id
            ),
        },
      ];
    }
    if (this.dataToShow === 'assignment') {
      //create array of assignments from active sections
      const teacherFiltered = this.model.teacherSections.filter(
        (assignment) => {
          return !assignment.dueDate
            ? true
            : assignment.dueDate.getTime() >
                this.dateBounds[this.currentBound].getTime();
        }
      );
      const studentFiltered = this.model.studentSections.filter(
        (assignment) => {
          return !assignment.dueDate
            ? true
            : assignment.dueDate.getTime() >
                this.dateBounds[this.currentBound].getTime();
        }
      );
      return [
        {
          details: teacherFiltered.reverse(),
          label: 'Assigned by Me',
          type: 'assignment',
        },
        {
          details: studentFiltered.reverse(),
          label: 'Assigned To Me',
          type: 'assignment',
        },
      ];
    }
    if (this.dataToShow === 'feedback') {
      const responses = this.model.responseThreads.filter((thread) => {
        return (
          thread.highestPrioritySubmission?.createDate.getTime() >
            this.dateBounds[this.currentBound].getTime() ||
          thread.highestPriorityResponse?.createDate.getTime() >
            this.dateBounds[this.currentBound].getTime()
        );
      });
      const received = responses.filter(
        (response) => response.threadType === 'submitter'
      );
      const sent = responses.filter(
        (response) =>
          response.threadType === 'mentor' || response.threadType === 'approver'
      );
      const threads = [
        { label: 'Given', details: sent, type: 'response' },
        { label: 'Received', details: received, type: 'response' },
      ];
      return this.model.user.isStudent ? threads.reverse() : threads;
    }
    //getter must return a value
    return [];
  }
  // called when user selects different date bound from dashboard display
  @action updateCurrentBound(e) {
    this.currentBound = e.target.value;
    this.updateSelectedData(
      this.data.find((item) => item.label === this.activeDetailTab)
    );
  }
  // called when user changes top tabs ('my workspaces', 'my assignments', 'my feedback')
  @action updateDataToShow(value) {
    this.dataToShow = value;
    this.selectedData = this.data[0].details;
    this.activeDetailTab = this.data[0].label;
  }
  // called when user chooses sub tab in category, i.e. 'mine' for 'my workspaces' or 'assigned by me' for 'my assignments'
  @action updateSelectedData(data) {
    this.selectedData = data.details;
    this.activeDetailTab = data.label;
  }
}
