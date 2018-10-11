/*
 * These tests are all pending now because the test db needs to be updated
 */

// REQUIRE MODULES
const chai = require('chai');
const chaiHttp = require('chai-http');

// REQUIRE FILES
const fixtures = require('./fixtures');
const helpers = require('./helpers');
const testUsers = require('./userFixtures').users;

const expect = chai.expect;
const host = helpers.host;
const baseUrl = "/api/sections/";

chai.use(chaiHttp);

describe('Section CRUD operations by account type', function() {
  function runTests(user) {
    describe(`Section CRUD operations as ${user.details.testDescriptionTitle}`, function() {
      this.timeout('10s');
      const agent = chai.request.agent(host);
      const { username, password, accountType, actingRole } = user.details;
      const { accessibleSectionCount, accessibleSection, inaccessibleSection, validSection, modifiableSection } = user.sections;
      // eslint-disable-next-line no-unused-vars
      const isStudent = accountType === 'S' || actingRole === 'student';

      before(async function(){
        try {
          await helpers.setup(agent, username, password);
        }catch(err) {
          console.log(err);
        }
      });

      after(() => {
        agent.close();
      });

       /** GET **/
  describe('/GET sections', () => {
    it('should get all sections', done => {
      agent
      .get(baseUrl)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        expect(res).to.have.status(200);
        expect(res.body).to.have.all.keys('sections');
        expect(res.body.sections).to.be.a('array');
        expect(res.body.sections).to.have.lengthOf(accessibleSectionCount);
        done();
      });
    });
  });
  if (accountType !== 'A') {
    describe('/GET inaccessible section by id', () => {
      it('should return 403 error', done => {
        const url = baseUrl + inaccessibleSection._id;
        agent
        .get(url)
        .end((err, res) => {
          if (err) {
            console.log(err);
          }
          expect(res).to.have.status(403);
          done();
        });
      });
    });
  }
  describe('/GET accessible section by ID', () => {
    it('should return 1 section with matching id', done => {
      agent
      .get(baseUrl + accessibleSection._id)
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        expect(res).to.have.status(200);
        expect(res.body).to.have.all.keys('section');
        expect(res.body.section).to.be.a('object');
        expect(res.body.section._id).to.eql(accessibleSection._id);
        done();
      });
    });
  });

  /** POST **/
  describe('/POST section', () => {
    let msg = 'should post a new section';
    if (isStudent) {
      msg = 'should return 403 error';
    }
    it(msg, done => {
      agent
      .post(baseUrl)
      .send({section: validSection})
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        if (isStudent) {
          expect(res).to.have.status(403);
          done();
        } else {
          expect(res).to.have.status(200);
          expect(res.body.section).to.have.any.keys('name', 'assignments', 'students', 'teachers');
          expect(res.body.section.name).to.eql(validSection.name);
          done();
        }
      });
    });
  });

  /** PUT name**/
  describe('/PUT update section name with permission', () => {
    let newName = 'new class';
    let msg = `should change the section name to ${newName}`;

    if (isStudent) {
      msg = 'should return 403 error';
    }
    it(msg, done => {
      let url = baseUrl + modifiableSection._id;
      agent
      .put(url)
      .send({
            section: {
              name: newName,
            }
      })
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        if (isStudent) {
          expect(res).to.have.status(403);
          done();
        } else {
          expect(res).to.have.status(200);
          expect(res.body.section).to.have.any.keys('name', 'assignments', 'students', 'teachers');
          expect(res.body.section.name).to.eql(newName);
          done();
        }
      });
    });
  });

  /** Add teachers **/
  xdescribe('add teacher to section', () => {
    it('should add one teacher to the section', done => {
      let url = baseUrl + 'addTeacher/' + fixtures.section._id;
      agent
      .put(url)
      .send({teacherId: '52964659e4bad7087700014c'})
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        expect(res).to.have.status(200);
        expect(res.body.section).to.have.any.keys('name', 'problems', 'students', 'teachers');
        expect(res.body.section.teachers).to.contain('52964659e4bad7087700014c');
        done();
      });
    });
  });

  /** Remove teachers **/
  xdescribe('remove teacher from section', () => {
    let url = baseUrl + 'removeTeacher/' + fixtures.section._id;
    it('should return an empty array', done => {
      agent
      .put(url)
      .send({teacherId: fixtures.teacher._id})
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        expect(res).to.have.status(200);
        expect(res.body.section).to.have.any.keys('name', 'problems', 'students', 'teachers');
        expect(res.body.section.teachers).to.not.contain(fixtures.teacher._id);
        done();
      });
    });
  });

  xdescribe('addStudent to section', () => {
    it('should add one student to the section', done => {
      let url = baseUrl + 'addStudent/' + fixtures.section._id;
      agent
      .put(url)
      .send({studentId: fixtures.student._id})
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        expect(res).to.have.status(200);
        expect(res.body.section).to.have.any.keys('name', 'problems', 'students', 'teachers');
        expect(res.body.section.students).to.contain(fixtures.student._id);
        done();
      });
    });
  });

  /** Remove teachers **/
  xdescribe('remove student from section', () => {
    let url = baseUrl + 'removeStudent/' + fixtures.section._id;
    it('should return an empty array', done => {
      agent
      .put(url)
      .send({studentName: fixtures.student.name})
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        expect(res).to.have.status(200);
        expect(res.body.section).to.have.any.keys('name', 'problems', 'students', 'teachers');
        expect(res.body.section.students).to.not.contain(fixtures.student.name);
        done();
      });
    });
  });

  //THIS NEEDS TO BE CHANGED TO ASSIGNMENT
  xdescribe('add problem to section', () => {
    it('should add one problem to the section', done => {
      let url = baseUrl + 'addProblem/' + fixtures.section._id;
      agent
      .put(url)
      .send({problem: fixtures.problem._id})
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        expect(res).to.have.status(200);
        expect(res.body.section).to.have.any.keys('name', 'problems', 'students', 'teachers');
        expect(res.body.section.problems).to.contain(fixtures.problem._id);
        done();
      });
    });
  });

  //THIS NEEDS TO BE CHANGED TO ASSIGNMENT
  xdescribe('remove problem from section', () => {
    let url = baseUrl + 'removeProblem/' + fixtures.section._id;
    it('should return an empty array', done => {
      agent
      .put(url)
      .send({problem: fixtures.problem._id})
      .end((err, res) => {
        if (err) {
          console.error(err);
        }
        expect(res).to.have.status(200);
        expect(res.body.section).to.have.any.keys('sectionId', 'name', 'problems', 'students', 'teachers');
        expect(res.body.section.problems).to.not.contain(fixtures.problem._id);
        done();
      });
    });
  });

    });
  }

  for (let user of Object.keys(testUsers)) {
    let testUser = testUsers[user];
    // eslint-disable-next-line no-await-in-loop
    runTests(testUser);
  }
});
